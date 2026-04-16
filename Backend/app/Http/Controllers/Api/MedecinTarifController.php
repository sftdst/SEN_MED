<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedecinTarif;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MedecinTarifController extends Controller
{
    // ── GET /medecin-tarifs ──────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = MedecinTarif::with(['service', 'medecin']);

        if ($request->filled('medecin_id')) {
            $query->where('medecin_id', $request->medecin_id);
        }
        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }
        if ($request->filled('actif')) {
            $query->where('actif', (bool) $request->actif);
        }

        $perPage = (int) ($request->per_page ?? 50);
        $data    = $query->orderBy('medecin_id')->paginate($perPage);

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ── POST /medecin-tarifs ─────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'medecin_id'       => 'required|string|max:50',
            'service_id'       => 'required|integer|exists:gen_mst_service,id_service',
            'prix_service'     => 'nullable|numeric|min:0',
            'majoration_ferie' => 'nullable|numeric|min:0',
            'type_majoration'  => 'nullable|in:pourcentage,montant_fixe',
            'actif'            => 'nullable|boolean',
            'note'             => 'nullable|string|max:500',
        ]);

        // Upsert : si la combinaison existe déjà, on met à jour
        $tarif = MedecinTarif::updateOrCreate(
            ['medecin_id' => $validated['medecin_id'], 'service_id' => $validated['service_id']],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Tarif enregistré avec succès',
            'data'    => $tarif->load(['service', 'medecin']),
        ], 201);
    }

    // ── GET /medecin-tarifs/{id} ─────────────────────────────────────────────
    public function show(MedecinTarif $medecinTarif): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $medecinTarif->load(['service', 'medecin'])]);
    }

    // ── PUT /medecin-tarifs/{id} ─────────────────────────────────────────────
    public function update(Request $request, MedecinTarif $medecinTarif): JsonResponse
    {
        $validated = $request->validate([
            'prix_service'     => 'nullable|numeric|min:0',
            'majoration_ferie' => 'nullable|numeric|min:0',
            'type_majoration'  => 'nullable|in:pourcentage,montant_fixe',
            'actif'            => 'nullable|boolean',
            'note'             => 'nullable|string|max:500',
        ]);

        $medecinTarif->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tarif modifié avec succès',
            'data'    => $medecinTarif->fresh(['service', 'medecin']),
        ]);
    }

    // ── DELETE /medecin-tarifs/{id} ──────────────────────────────────────────
    public function destroy(MedecinTarif $medecinTarif): JsonResponse
    {
        $medecinTarif->delete();
        return response()->json(['success' => true, 'message' => 'Tarif supprimé']);
    }

    // ── GET /medecin-tarifs/resoudre ─────────────────────────────────────────
    // ?medecin_id=X&service_id=Y&jour_ferie=0
    public function resoudre(Request $request): JsonResponse
    {
        $request->validate([
            'medecin_id' => 'required|string',
            'service_id' => 'required|integer',
            'jour_ferie' => 'nullable|boolean',
        ]);

        $result = MedecinTarif::resoudre(
            $request->medecin_id,
            (int) $request->service_id,
            (bool) ($request->jour_ferie ?? false)
        );

        return response()->json(['success' => true, 'data' => $result]);
    }

    // ── GET /medecin-tarifs/medecin/{medecinId}/revenus ──────────────────────
    // Revenus du médecin : services facturés + statut paiement
    public function revenus(Request $request, string $medecinId): JsonResponse
    {
        // On récupère les détails de factures liés au médecin via les visites
        $query = \DB::table('bill_txn_bill_details as bd')
            ->join('bill_txn_bill_hd as bh', 'bd.bill_id', '=', 'bh.id')
            ->join('clinic_txn_adt as v', 'bh.visite_id', '=', 'v.id')
            ->join('gen_mst_service as s', 'bd.service_id', '=', 's.id_service')
            ->join('gen_mst_patient as p', 'v.patient_id', '=', 'p.patient_id')
            ->where('v.consulting_doctor_id', $medecinId)
            ->select([
                'bd.id as detail_id',
                'bh.id as bill_id',
                'bh.bill_date',
                'bh.paid_amount',
                'bh.pending_amount',
                'bh.net_amount',
                'bh.mode_paye',
                's.short_name as service_nom',
                's.type_categorie',
                'bd.service_price',
                'bd.service_qty',
                'bd.total_price',
                'p.patient_name',
                \DB::raw("CONCAT(p.first_name, ' ', p.last_name) as patient_complet"),
                'v.id as visite_id',
            ]);

        if ($request->filled('date_debut')) {
            $query->whereDate('bh.bill_date', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('bh.bill_date', '<=', $request->date_fin);
        }
        if ($request->filled('statut_paiement')) {
            if ($request->statut_paiement === 'paye') {
                $query->where('bh.pending_amount', '<=', 0);
            } elseif ($request->statut_paiement === 'en_attente') {
                $query->where('bh.pending_amount', '>', 0);
            }
        }

        $items = $query->orderByDesc('bh.bill_date')->get();

        // Agrégats
        $totalFacture = $items->sum('total_price');
        $totalPaye    = $items->sum(fn($i) => max(0, $i->total_price - $i->pending_amount));
        $totalImpaye  = $totalFacture - $totalPaye;

        return response()->json([
            'success' => true,
            'data'    => [
                'items'         => $items,
                'total_facture' => round($totalFacture, 2),
                'total_paye'    => round($totalPaye, 2),
                'total_impaye'  => round($totalImpaye, 2),
                'nb_actes'      => $items->count(),
            ],
        ]);
    }
}
