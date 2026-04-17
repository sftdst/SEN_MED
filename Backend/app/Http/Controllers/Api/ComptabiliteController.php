<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ComptabiliteController extends Controller
{
    /**
     * Liste des factures en attente de paiement.
     * Agrège les lignes de gen_mst_facture par bill_id.
     */
    public function facturesEnAttente(Request $request): JsonResponse
    {
        $request->validate([
            'date_debut'    => 'nullable|date',
            'date_fin'      => 'nullable|date',
            'partenaire_id' => 'nullable|string',
            'search'        => 'nullable|string|max:100',
            'per_page'      => 'nullable|integer|min:1|max:200',
        ]);

        $q = DB::table('gen_mst_facture as f')
            ->leftJoin('gen_mst_patient as p',             'f.patient_id',   '=', 'p.patient_id')
            ->leftJoin('bill_txn_bill_hd as b',            'f.bill_id',      '=', 'b.bill_hd_id')
            ->leftJoin('gen_mst_partenaire_header as par', 'f.compagny_id',  '=', 'par.id_gen_partenaire')
            ->where('f.StatutPaiement', 'EN_ATTENTE')
            ->groupBy(
                'f.bill_id', 'f.patient_id', 'f.compagny_id',
                'p.patient_name', 'p.first_name', 'p.last_name',
                'p.ssn_no', 'p.mobile_number', 'p.contact_number',
                'b.bill_no', 'b.bill_date',
                'par.Nom', 'par.id_gen_partenaire'
            )
            ->select([
                'f.bill_id',
                'f.patient_id',
                'f.compagny_id',
                DB::raw("COALESCE(NULLIF(TRIM(p.patient_name),''), TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,''))) AS patient_name"),
                'p.ssn_no',
                'p.mobile_number',
                'p.contact_number',
                DB::raw('SUM(f."MontantTotalFacture") AS montant_total'),
                DB::raw('SUM(f.patient_payable)       AS montant_patient'),
                DB::raw('SUM(f."MontantPartenaire")   AS montant_partenaire'),
                DB::raw('SUM(f."MontantpayerPartenaire") AS montant_paye_partenaire'),
                DB::raw('SUM(f."MontantPayer")        AS montant_deja_paye'),
                DB::raw('COUNT(f."IDgen_mst_facture") AS nb_services'),
                'b.bill_no',
                'b.bill_date',
                'par.Nom AS partenaire_nom',
                'par.id_gen_partenaire AS partenaire_id',
            ]);

        // ── Filtres ──────────────────────────────────────────────────────────
        if ($request->filled('date_debut')) {
            $q->whereRaw('f."DateCreation"::date >= ?', [$request->date_debut]);
        }
        if ($request->filled('date_fin')) {
            $q->whereRaw('f."DateCreation"::date <= ?', [$request->date_fin]);
        }
        if ($request->filled('partenaire_id')) {
            $q->where('f.compagny_id', $request->partenaire_id);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $q->where(function ($w) use ($s) {
                $w->whereRaw('COALESCE(p.patient_name,\'\') ILIKE ?', [$s])
                  ->orWhereRaw('COALESCE(p.first_name,\'\') ILIKE ?', [$s])
                  ->orWhereRaw('COALESCE(p.last_name,\'\') ILIKE ?', [$s])
                  ->orWhereRaw('COALESCE(p.ssn_no,\'\') ILIKE ?', [$s])
                  ->orWhereRaw('COALESCE(p.mobile_number,\'\') ILIKE ?', [$s])
                  ->orWhereRaw('COALESCE(b.bill_no,\'\') ILIKE ?', [$s]);
            });
        }

        $q->orderByDesc('b.bill_date');

        $perPage  = (int) $request->get('per_page', 20);
        $rows     = $q->paginate($perPage);

        // ── Totaux globaux (sans pagination) ─────────────────────────────────
        $totaux = DB::table('gen_mst_facture as f')
            ->leftJoin('gen_mst_patient as p', 'f.patient_id', '=', 'p.patient_id')
            ->where('f.StatutPaiement', 'EN_ATTENTE')
            ->when($request->filled('partenaire_id'), fn($q) => $q->where('f.compagny_id', $request->partenaire_id))
            ->when($request->filled('date_debut'),    fn($q) => $q->whereRaw('f."DateCreation"::date >= ?', [$request->date_debut]))
            ->when($request->filled('date_fin'),      fn($q) => $q->whereRaw('f."DateCreation"::date <= ?', [$request->date_fin]))
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = '%' . $request->search . '%';
                $q->where(fn($w) => $w
                    ->whereRaw('COALESCE(p.patient_name,\'\') ILIKE ?', [$s])
                    ->orWhereRaw('COALESCE(p.first_name,\'\') ILIKE ?', [$s])
                    ->orWhereRaw('COALESCE(p.ssn_no,\'\') ILIKE ?', [$s])
                );
            })
            ->selectRaw('
                COUNT(DISTINCT f.bill_id)            AS nb_factures,
                SUM(f."MontantTotalFacture")         AS total_brut,
                SUM(f.patient_payable)               AS total_patient,
                SUM(f."MontantPartenaire")           AS total_partenaire
            ')
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'totaux'  => $totaux,
        ]);
    }

    /**
     * Crédits patients : cumulé par patient (une ligne par patient débiteur).
     */
    public function creditsPatients(Request $request): JsonResponse
    {
        $request->validate([
            'date_debut' => 'nullable|date',
            'date_fin'   => 'nullable|date',
            'search'     => 'nullable|string|max:100',
            'per_page'   => 'nullable|integer|min:1|max:200',
        ]);

        $q = DB::table('bill_txn_bill_hd as b')
            ->leftJoin('gen_mst_patient as p',             'b.patient_id', '=', 'p.patient_id')
            ->leftJoin('gen_mst_partenaire_header as par', 'p.company_id', '=', 'par.id_gen_partenaire')
            ->whereIn('b.bill_status_id', [1, 2])
            ->where('b.pending_amount', '>', 0)
            ->groupBy(
                'b.patient_id',
                'p.patient_name', 'p.first_name', 'p.last_name',
                'p.ssn_no', 'p.mobile_number', 'p.company_id',
                'par.Nom'
            )
            ->select([
                'b.patient_id',
                DB::raw("COALESCE(NULLIF(TRIM(p.patient_name),''), TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,''))) AS patient_name"),
                'p.ssn_no', 'p.mobile_number',
                'par.Nom AS partenaire_nom',
                DB::raw('COUNT(b.bill_hd_id)      AS nb_factures'),
                DB::raw('SUM(b.bill_amount)        AS total_factures'),
                DB::raw('SUM(b.paid_amount)        AS total_paye'),
                DB::raw('SUM(b.pending_amount)     AS total_restant'),
                DB::raw('MAX(b.bill_date)          AS derniere_facture'),
            ]);

        if ($request->filled('date_debut')) {
            $q->whereRaw('b.bill_date::date >= ?', [$request->date_debut]);
        }
        if ($request->filled('date_fin')) {
            $q->whereRaw('b.bill_date::date <= ?', [$request->date_fin]);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $q->where(function ($w) use ($s) {
                $w->whereRaw("COALESCE(p.patient_name,'')    ILIKE ?", [$s])
                  ->orWhereRaw("COALESCE(p.first_name,'')   ILIKE ?", [$s])
                  ->orWhereRaw("COALESCE(p.last_name,'')    ILIKE ?", [$s])
                  ->orWhereRaw("COALESCE(p.ssn_no,'')       ILIKE ?", [$s])
                  ->orWhereRaw("COALESCE(p.mobile_number,'') ILIKE ?", [$s]);
            });
        }

        $q->orderByDesc(DB::raw('SUM(b.pending_amount)'));

        $perPage = (int) $request->get('per_page', 20);
        $rows    = $q->paginate($perPage);

        $totaux = DB::table('bill_txn_bill_hd as b')
            ->whereIn('b.bill_status_id', [1, 2])
            ->where('b.pending_amount', '>', 0)
            ->selectRaw('COUNT(DISTINCT b.patient_id) AS nb_patients, COUNT(*) AS nb_credits, SUM(b.bill_amount) AS total_factures, SUM(b.paid_amount) AS total_paye, SUM(b.pending_amount) AS total_restant')
            ->first();

        return response()->json(['success' => true, 'data' => $rows, 'totaux' => $totaux]);
    }

    /**
     * Liste des factures en cours pour un patient donné.
     */
    public function creditPatientFactures(Request $request, $patientId): JsonResponse
    {
        $bills = DB::table('bill_txn_bill_hd as b')
            ->where('b.patient_id', $patientId)
            ->whereIn('b.bill_status_id', [1, 2])
            ->where('b.pending_amount', '>', 0)
            ->select([
                'b.bill_hd_id', 'b.bill_no', 'b.bill_date',
                'b.bill_amount', 'b.paid_amount', 'b.pending_amount',
                'b.discount_amount', 'b.bill_status_id', 'b.mode_paye',
            ])
            ->orderByDesc('b.bill_date')
            ->get();

        return response()->json(['success' => true, 'data' => $bills]);
    }

    /**
     * Liste des partenaires pour le filtre.
     */
    public function partenaires(): JsonResponse
    {
        $list = DB::table('gen_mst_partenaire_header')
            ->where('status', true)
            ->orderBy('Nom')
            ->select('id_gen_partenaire', 'Nom')
            ->get();

        return response()->json(['success' => true, 'data' => $list]);
    }
}
