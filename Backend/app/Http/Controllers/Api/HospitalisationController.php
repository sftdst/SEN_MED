<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chambre;
use App\Models\FactureHospitalisation;
use App\Models\Hospitalisation;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HospitalisationController extends Controller
{
    // ── Liste ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Hospitalisation::with(['patient', 'chambre', 'medecin', 'facture'])
                                ->orderByDesc('date_entree');

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        if ($request->filled('date_from')) {
            $query->where('date_entree', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('date_entree', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->whereHas('patient', fn($q) =>
                $q->where('patient_name', 'like', "%{$s}%")
                  ->orWhere('patient_id', 'like', "%{$s}%")
            );
        }

        $data = $query->paginate($request->get('per_page', 20));

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ── Admission ─────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id'         => 'required|string|exists:gen_mst_patient,patient_id',
            'id_chambre'         => 'required|integer|exists:hosp_chambres,id_chambre',
            'medecin_id'         => 'nullable|string',
            'date_entree'        => 'required|date',
            'date_sortie_prevue' => 'nullable|date|after_or_equal:date_entree',
            'motif'              => 'nullable|string|max:500',
        ]);

        $chambre = Chambre::findOrFail($validated['id_chambre']);

        if ($chambre->statut === 'Occupée') {
            return response()->json([
                'success' => false,
                'message' => "La chambre {$chambre->code_chambre} est déjà occupée.",
            ], 422);
        }

        // Vérifier que le patient n'a pas déjà une hospitalisation en cours
        $dejaHospitalise = Hospitalisation::where('patient_id', $validated['patient_id'])
                                          ->where('statut', 'En cours')
                                          ->exists();
        if ($dejaHospitalise) {
            return response()->json([
                'success' => false,
                'message' => 'Ce patient est déjà hospitalisé.',
            ], 422);
        }

        try {
            DB::beginTransaction();

            $hosp = Hospitalisation::create([
                ...$validated,
                'statut'          => 'En cours',
                'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            ]);

            // Chambre → Occupée
            $chambre->update(['statut' => 'Occupée']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Patient admis avec succès.',
                'data'    => $hosp->load(['patient', 'chambre', 'medecin']),
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Détail ────────────────────────────────────────────────────────────────

    public function show(Hospitalisation $hospitalisation): JsonResponse
    {
        $hospitalisation->load(['patient', 'chambre.equipements', 'medecin', 'facture']);

        $data = $hospitalisation->toArray();
        $data['nb_jours']      = $hospitalisation->nb_jours;
        $data['montant_total'] = $hospitalisation->montant_total;

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ── Sortie patient ────────────────────────────────────────────────────────

    public function sortie(Request $request, Hospitalisation $hospitalisation): JsonResponse
    {
        if ($hospitalisation->statut !== 'En cours') {
            return response()->json([
                'success' => false,
                'message' => 'Cette hospitalisation n\'est pas en cours.',
            ], 422);
        }

        $validated = $request->validate([
            'date_sortie_reelle' => 'required|date|after_or_equal:' . $hospitalisation->date_entree->toDateString(),
            'montant_soins'      => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $dateEntree = $hospitalisation->date_entree;
            $dateSortie = Carbon::parse($validated['date_sortie_reelle']);
            $nbJours    = max(1, $dateEntree->diffInDays($dateSortie));
            $prixJ      = (float) $hospitalisation->chambre->prix_journalier;
            $montantHeb = round($nbJours * $prixJ, 2);
            $montantSoins = (float) ($validated['montant_soins'] ?? 0);
            $montantTotal = $montantHeb + $montantSoins;

            // Mettre à jour l'hospitalisation
            $hospitalisation->update([
                'date_sortie_reelle' => $validated['date_sortie_reelle'],
                'statut'             => 'Terminée',
            ]);

            // Chambre → À nettoyer
            $hospitalisation->chambre->update(['statut' => 'À nettoyer']);

            // Créer/mettre à jour la facture
            FactureHospitalisation::updateOrCreate(
                ['id_hospitalisation' => $hospitalisation->id_hospitalisation],
                [
                    'nb_jours'            => $nbJours,
                    'prix_journalier'     => $prixJ,
                    'montant_hebergement' => $montantHeb,
                    'montant_soins'       => $montantSoins,
                    'montant_total'       => $montantTotal,
                    'montant_paye'        => 0,
                    'montant_restant'     => $montantTotal,
                    'statut_paiement'     => 'EN_ATTENTE',
                    'date_facture'        => $dateSortie->toDateString(),
                    'created_user_id'     => auth()?->user()?->id ?? 'SYSTEM',
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sortie enregistrée. Facture générée.',
                'data'    => $hospitalisation->load(['patient', 'chambre', 'facture']),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Chambre → Disponible (après nettoyage) ────────────────────────────────

    public function marquerPropre(Chambre $chambre): JsonResponse
    {
        if ($chambre->statut !== 'À nettoyer') {
            return response()->json([
                'success' => false,
                'message' => "La chambre n'est pas en statut 'À nettoyer'.",
            ], 422);
        }

        $chambre->update(['statut' => 'Disponible']);

        return response()->json([
            'success' => true,
            'message' => 'Chambre marquée comme disponible.',
            'data'    => $chambre,
        ]);
    }

    // ── Tableau de bord ───────────────────────────────────────────────────────

    public function dashboard(): JsonResponse
    {
        $enCours     = Hospitalisation::where('statut', 'En cours')->count();
        $terminees   = Hospitalisation::where('statut', 'Terminée')->count();
        $chambresOcc = Chambre::where('statut', 'Occupée')->count();
        $chambresTotal = Chambre::count();
        $tauxOcc     = $chambresTotal > 0 ? round($chambresOcc / $chambresTotal * 100, 1) : 0;
        $revenus     = FactureHospitalisation::sum('montant_total');
        $revenusMois = FactureHospitalisation::whereMonth('date_facture', now()->month)
                                             ->whereYear('date_facture', now()->year)
                                             ->sum('montant_total');

        return response()->json([
            'success' => true,
            'data'    => [
                'hospitalisations_en_cours' => $enCours,
                'hospitalisations_terminees' => $terminees,
                'chambres_occupees'         => $chambresOcc,
                'chambres_total'            => $chambresTotal,
                'taux_occupation'           => $tauxOcc,
                'revenus_total'             => $revenus,
                'revenus_mois'              => $revenusMois,
            ],
        ]);
    }
}
