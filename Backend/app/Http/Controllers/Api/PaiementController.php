<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillHeader;
use App\Models\Facture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    /**
     * Détail complet d'une facture pour le formulaire de paiement.
     */
    public function detail(int $billId): JsonResponse
    {
        $bill = DB::table('bill_txn_bill_hd as b')
            ->leftJoin('gen_mst_patient as p',             'b.patient_id',  '=', 'p.patient_id')
            ->leftJoin('gen_mst_partenaire_header as par', 'p.company_id',  '=', 'par.id_gen_partenaire')
            ->where('b.bill_hd_id', $billId)
            ->select([
                'b.bill_hd_id', 'b.bill_no', 'b.bill_date', 'b.patient_id',
                'b.bill_amount', 'b.net_amount', 'b.paid_amount', 'b.pending_amount',
                'b.discount_amount', 'b.cash_amount', 'b.card_amount',
                'b.cheque_amount', 'b.montant_mobile', 'b.mode_paye',
                'b.bill_status_id', 'b.mon_remb', 'b.adt_id',
                DB::raw("COALESCE(NULLIF(TRIM(p.patient_name),''), TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,''))) AS patient_name"),
                'p.ssn_no', 'p.mobile_number', 'p.company_id',
                'par.Nom as partenaire_nom',
            ])
            ->first();

        if (!$bill) {
            return response()->json(['success' => false, 'message' => 'Facture introuvable'], 404);
        }

        $services = DB::table('gen_mst_facture')
            ->where('bill_id', $billId)
            ->select([
                'IDgen_mst_facture', 'NomDescription', 'IDService',
                'PrixService', 'MontantTotalFacture', 'patient_payable',
                'MontantPartenaire', 'MontantPayer', 'MontantRestant',
                'StatutPaiement', 'DateCreation', 'MontantpayerPartenaire',
            ])
            ->get();

        $totalBrut       = $services->sum('MontantTotalFacture');
        $totalPatient    = $services->sum('patient_payable');
        $totalPartenaire = $services->sum('MontantPartenaire');
        $totalDejaPaye   = $services->sum('MontantPayer');
        $totalRestant    = max(0, $totalPatient - $totalDejaPaye - ($bill->discount_amount ?? 0));

        // Historique des paiements pour audit
        $historique = DB::table('bill_txn_patient_payments')
            ->where('patient_id', $bill->patient_id)
            ->orderByDesc('payment_date')
            ->select([
                'payment_id', 'payment_date', 'paid_amount', 'mode_paye',
                'cash_amount', 'card_amount', 'cheque_amount', 'mobile_amount',
                'created_dttm',
            ])
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'bill'       => $bill,
                'services'   => $services,
                'historique' => $historique,
                'totaux'     => [
                    'total_brut'       => $totalBrut,
                    'total_patient'    => $totalPatient,
                    'total_partenaire' => $totalPartenaire,
                    'total_deja_paye'  => $totalDejaPaye,
                    'total_restant'    => $totalRestant,
                ],
            ],
        ]);
    }

    /**
     * Enregistrer un paiement (simple ou combiné).
     */
    public function payer(Request $request, int $billId): JsonResponse
    {
        $request->validate([
            'remise'                  => 'nullable|numeric|min:0',
            'especes.montant'         => 'nullable|numeric|min:0',
            'especes.recu'            => 'nullable|numeric|min:0',
            'especes.monnaie_rendue'  => 'nullable|boolean',
            'especes.montant_rendu'   => 'nullable|numeric|min:0',
            'carte.montant'           => 'nullable|numeric|min:0',
            'carte.numero'            => 'nullable|string|max:50',
            'carte.banque'            => 'nullable|string|max:100',
            'cheque.montant'          => 'nullable|numeric|min:0',
            'cheque.numero'           => 'nullable|string|max:50',
            'cheque.date'             => 'nullable|date',
            'cheque.banque'           => 'nullable|string|max:100',
            'mobile.montant'          => 'nullable|numeric|min:0',
            'mobile.numero'           => 'nullable|string|max:20',
            'mobile.operateur'        => 'nullable|string|max:50',
        ]);

        $bill = BillHeader::find($billId);
        if (!$bill) {
            return response()->json(['success' => false, 'message' => 'Facture introuvable'], 404);
        }
        if ($bill->bill_status_id === 3) {
            return response()->json(['success' => false, 'message' => 'Cette facture est déjà payée intégralement.'], 422);
        }

        $remise    = floatval($request->input('remise', 0));
        $cashAmt   = floatval($request->input('especes.montant', 0));
        $cardAmt   = floatval($request->input('carte.montant', 0));
        $chequeAmt = floatval($request->input('cheque.montant', 0));
        $mobAmt    = floatval($request->input('mobile.montant', 0));
        $totalPaye = $cashAmt + $cardAmt + $chequeAmt + $mobAmt;

        if ($totalPaye <= 0 && $remise <= 0) {
            return response()->json(['success' => false, 'message' => 'Veuillez saisir un montant de paiement.'], 422);
        }

        $modes = array_filter([
            $cashAmt   > 0 ? 'ESPECES' : null,
            $cardAmt   > 0 ? 'CARTE'   : null,
            $chequeAmt > 0 ? 'CHEQUE'  : null,
            $mobAmt    > 0 ? 'MOBILE'  : null,
        ]);

        try {
            DB::beginTransaction();

            $services        = Facture::where('bill_id', $billId)->get();
            $totalPatient    = $services->sum('patient_payable');
            $adjustedPatient = max(0, $totalPatient - $remise);
            $newPaid         = floatval($bill->paid_amount) + $totalPaye;
            $pending         = max(0, $adjustedPatient - $newPaid);
            $monRemb         = max(0, $newPaid - $adjustedPatient);

            $statusId = match(true) {
                $pending <= 0  => 3, // PAYE
                $newPaid  > 0  => 2, // PARTIELLEMENT_PAYE
                default        => 1, // EN_ATTENTE
            };

            // ── 1. Mise à jour entête ────────────────────────────────────────
            $bill->update([
                'paid_amount'     => $newPaid,
                'pending_amount'  => $pending,
                'cash_amount'     => floatval($bill->cash_amount)   + $cashAmt,
                'card_amount'     => floatval($bill->card_amount)   + $cardAmt,
                'cheque_amount'   => floatval($bill->cheque_amount) + $chequeAmt,
                'montant_mobile'  => floatval($bill->montant_mobile)+ $mobAmt,
                'discount_amount' => floatval($bill->discount_amount) + $remise,
                'bill_status_id'  => $statusId,
                'mode_paye'       => implode('+', $modes),
                'mon_remb'        => $monRemb,
                'card_no'         => $request->input('carte.numero')    ?? $bill->card_no,
                'cheque_no'       => $request->input('cheque.numero')   ?? $bill->cheque_no,
                'cheque_date'     => $request->input('cheque.date')     ?? $bill->cheque_date,
                'bank_id'         => $request->input('carte.banque')
                                  ?? $request->input('cheque.banque')   ?? $bill->bank_id,
                'telephone'       => $request->input('mobile.numero')   ?? $bill->telephone,
                'operateur_mobil' => $request->input('mobile.operateur')?? $bill->operateur_mobil,
                'status_monaie'   => $request->boolean('especes.monnaie_rendue') ? 'OUI' : 'NON',
                'mont_monaie'     => floatval($request->input('especes.montant_rendu', 0)),
                'mont_recu'       => floatval($request->input('especes.recu', 0)),
            ]);

            // ── 2. Enregistrement paiement ───────────────────────────────────
            DB::table('bill_txn_patient_payments')->insert([
                'patient_id'          => $bill->patient_id,
                'payment_date'        => now()->toDateString(),
                'paid_amount'         => $totalPaye,
                'total_amount'        => $totalPatient,
                'discount_amount'     => $remise,
                'net_amount'          => $adjustedPatient,
                'cash_amount'         => $cashAmt,
                'card_amount'         => $cardAmt,
                'cheque_amount'       => $chequeAmt,
                'mobile_amount'       => $mobAmt,
                'card_no'             => $request->input('carte.numero'),
                'cheque_no'           => $request->input('cheque.numero'),
                'cheque_date'         => $request->input('cheque.date'),
                'bank_id'             => $request->input('carte.banque') ?? $request->input('cheque.banque'),
                'mode_paye'           => implode('+', $modes),
                'mont_recu'           => floatval($request->input('especes.recu', 0)),
                'status_monaie'       => $request->boolean('especes.monnaie_rendue') ? 'OUI' : 'NON',
                'mont_monaie'         => floatval($request->input('especes.montant_rendu', 0)),
                'operatuer'           => $request->input('mobile.operateur'),
                'num_mobile'          => $request->input('mobile.numero'),
                'created_dttm'        => now(),
                'paiment_id_numeric'  => (DB::table('bill_txn_patient_payments')->max('paiment_id_numeric') ?? 0) + 1,
            ]);

            // ── 3. Distribution sur les lignes facture ───────────────────────
            $dispatchable = $totalPaye + $remise;
            $remaining    = $dispatchable;

            foreach ($services->sortBy('IDgen_mst_facture')->values() as $svc) {
                if ($remaining <= 0) break;

                $patientPart  = floatval($svc->patient_payable);
                $alreadyPaid  = floatval($svc->MontantPayer);
                $stillOwed    = max(0, $patientPart - $alreadyPaid);
                $applyAmt     = min($stillOwed, $remaining);
                $remaining   -= $applyAmt;

                $newMontantPaye = round($alreadyPaid + $applyAmt, 3);
                $newStatut = match(true) {
                    $newMontantPaye >= $patientPart => 'PAYE',
                    $newMontantPaye > 0             => 'PARTIELLEMENT_PAYE',
                    default                         => 'EN_ATTENTE',
                };

                Facture::where('IDgen_mst_facture', $svc->IDgen_mst_facture)->update([
                    'MontantPayer'   => $newMontantPaye,
                    'MontantRestant' => max(0, round($patientPart - $newMontantPaye, 3)),
                    'StatutPaiement' => $newStatut,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $statusId === 3
                    ? 'Paiement complet enregistré avec succès.'
                    : 'Paiement partiel enregistré.',
                'data' => [
                    'bill_status_id' => $statusId,
                    'paid_amount'    => $newPaid,
                    'pending_amount' => $pending,
                    'mon_remb'       => $monRemb,
                ],
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement du paiement.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Historique des paiements (factures avec paid_amount > 0).
     */
    public function historique(Request $request): JsonResponse
    {
        $request->validate([
            'date_debut'  => 'nullable|date',
            'date_fin'    => 'nullable|date',
            'search'      => 'nullable|string|max:100',
            'bill_no'     => 'nullable|string|max:60',
            'statut'      => 'nullable|integer|in:1,2,3',
            'per_page'    => 'nullable|integer|min:1|max:200',
        ]);

        $q = DB::table('bill_txn_bill_hd as b')
            ->leftJoin('gen_mst_patient as p',             'b.patient_id', '=', 'p.patient_id')
            ->leftJoin('gen_mst_partenaire_header as par', 'p.company_id', '=', 'par.id_gen_partenaire')
            ->whereIn('b.bill_status_id', [2, 3])
            ->select([
                'b.bill_hd_id', 'b.bill_no', 'b.bill_date', 'b.patient_id',
                'b.bill_amount', 'b.paid_amount', 'b.pending_amount',
                'b.discount_amount', 'b.cash_amount', 'b.card_amount',
                'b.cheque_amount', 'b.montant_mobile', 'b.mode_paye',
                'b.bill_status_id', 'b.mon_remb',
                'b.card_no', 'b.cheque_no', 'b.cheque_date', 'b.bank_id',
                'b.telephone', 'b.operateur_mobil',
                'b.status_monaie', 'b.mont_monaie', 'b.mont_recu',
                DB::raw("COALESCE(NULLIF(TRIM(p.patient_name),''), TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,''))) AS patient_name"),
                'p.ssn_no', 'p.mobile_number',
                'par.Nom as partenaire_nom',
            ]);

        if ($request->filled('date_debut')) {
            $q->whereRaw('b.bill_date::date >= ?', [$request->date_debut]);
        }
        if ($request->filled('date_fin')) {
            $q->whereRaw('b.bill_date::date <= ?', [$request->date_fin]);
        }
        if ($request->filled('bill_no')) {
            $q->where('b.bill_no', 'ilike', '%' . $request->bill_no . '%');
        }
        if ($request->filled('statut')) {
            $q->where('b.bill_status_id', $request->statut);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $q->where(function ($w) use ($s) {
                $w->whereRaw("COALESCE(p.patient_name,'') ILIKE ?", [$s])
                  ->orWhereRaw("COALESCE(p.first_name,'')  ILIKE ?", [$s])
                  ->orWhereRaw("COALESCE(p.last_name,'')   ILIKE ?", [$s])
                  ->orWhereRaw("COALESCE(p.ssn_no,'')      ILIKE ?", [$s])
                  ->orWhereRaw("COALESCE(p.mobile_number,'') ILIKE ?", [$s]);
            });
        }

        $q->orderByDesc('b.bill_date');

        $perPage = (int) $request->get('per_page', 20);
        $rows    = $q->paginate($perPage);

        // Totaux globaux
        $totaux = DB::table('bill_txn_bill_hd as b')
            ->whereIn('b.bill_status_id', [2, 3])
            ->when($request->filled('statut'), fn($q) => $q->where('b.bill_status_id', $request->statut))
            ->selectRaw('COUNT(*) AS nb_paiements, SUM(b.paid_amount) AS total_paye, SUM(b.bill_amount) AS total_factures, SUM(b.pending_amount) AS total_restant')
            ->first();

        return response()->json(['success' => true, 'data' => $rows, 'totaux' => $totaux]);
    }

    /**
     * Solder toutes les factures en cours d'un patient en un seul paiement.
     */
    public function solderPatient(Request $request, $patientId): JsonResponse
    {
        $request->validate([
            'remise'                  => 'nullable|numeric|min:0',
            'especes.montant'         => 'nullable|numeric|min:0',
            'especes.recu'            => 'nullable|numeric|min:0',
            'especes.monnaie_rendue'  => 'nullable|boolean',
            'especes.montant_rendu'   => 'nullable|numeric|min:0',
            'carte.montant'           => 'nullable|numeric|min:0',
            'carte.numero'            => 'nullable|string|max:50',
            'carte.banque'            => 'nullable|string|max:100',
            'cheque.montant'          => 'nullable|numeric|min:0',
            'cheque.numero'           => 'nullable|string|max:50',
            'cheque.date'             => 'nullable|date',
            'cheque.banque'           => 'nullable|string|max:100',
            'mobile.montant'          => 'nullable|numeric|min:0',
            'mobile.numero'           => 'nullable|string|max:20',
            'mobile.operateur'        => 'nullable|string|max:50',
        ]);

        $cashAmt   = floatval($request->input('especes.montant', 0));
        $cardAmt   = floatval($request->input('carte.montant',   0));
        $chequeAmt = floatval($request->input('cheque.montant',  0));
        $mobAmt    = floatval($request->input('mobile.montant',  0));
        $remise    = floatval($request->input('remise', 0));
        $totalPaye = $cashAmt + $cardAmt + $chequeAmt + $mobAmt;

        if ($totalPaye <= 0 && $remise <= 0) {
            return response()->json(['success' => false, 'message' => 'Veuillez saisir un montant.'], 422);
        }

        $bills = BillHeader::where('patient_id', $patientId)
            ->whereIn('bill_status_id', [1, 2])
            ->where('pending_amount', '>', 0)
            ->orderBy('bill_date')
            ->get();

        if ($bills->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Aucune facture en cours pour ce patient.'], 404);
        }

        $modes = array_values(array_filter([
            $cashAmt   > 0 ? 'ESPECES' : null,
            $cardAmt   > 0 ? 'CARTE'   : null,
            $chequeAmt > 0 ? 'CHEQUE'  : null,
            $mobAmt    > 0 ? 'MOBILE'  : null,
        ]));

        try {
            DB::beginTransaction();

            $remaining = $totalPaye + $remise;
            $billsSettled = 0;

            foreach ($bills as $bill) {
                if ($remaining <= 0) break;

                $pendingForBill = floatval($bill->pending_amount);
                $applyToBill    = min($pendingForBill, $remaining);
                $remaining     -= $applyToBill;

                $newPaid    = floatval($bill->paid_amount) + $applyToBill;
                $newPending = max(0, floatval($bill->pending_amount) - $applyToBill);
                $statusId   = $newPending <= 0 ? 3 : 2;

                $bill->update([
                    'paid_amount'     => $newPaid,
                    'pending_amount'  => $newPending,
                    'cash_amount'     => floatval($bill->cash_amount)    + ($cashAmt   > 0 ? ($cashAmt   * $applyToBill / $totalPaye) : 0),
                    'card_amount'     => floatval($bill->card_amount)    + ($cardAmt   > 0 ? ($cardAmt   * $applyToBill / $totalPaye) : 0),
                    'cheque_amount'   => floatval($bill->cheque_amount)  + ($chequeAmt > 0 ? ($chequeAmt * $applyToBill / $totalPaye) : 0),
                    'montant_mobile'  => floatval($bill->montant_mobile) + ($mobAmt    > 0 ? ($mobAmt    * $applyToBill / $totalPaye) : 0),
                    'bill_status_id'  => $statusId,
                    'mode_paye'       => implode('+', $modes),
                    'card_no'         => $request->input('carte.numero')   ?? $bill->card_no,
                    'cheque_no'       => $request->input('cheque.numero')  ?? $bill->cheque_no,
                    'cheque_date'     => $request->input('cheque.date')    ?? $bill->cheque_date,
                    'bank_id'         => $request->input('carte.banque')   ?? $request->input('cheque.banque') ?? $bill->bank_id,
                    'telephone'       => $request->input('mobile.numero')  ?? $bill->telephone,
                    'operateur_mobil' => $request->input('mobile.operateur') ?? $bill->operateur_mobil,
                    'status_monaie'   => $request->boolean('especes.monnaie_rendue') ? 'OUI' : 'NON',
                    'mont_monaie'     => floatval($request->input('especes.montant_rendu', 0)),
                    'mont_recu'       => floatval($request->input('especes.recu', 0)),
                ]);

                // Distribution sur les lignes facture
                $services    = Facture::where('bill_id', $bill->bill_hd_id)->get();
                $dispatchable = $applyToBill;

                foreach ($services->sortBy('IDgen_mst_facture')->values() as $svc) {
                    if ($dispatchable <= 0) break;
                    $patientPart  = floatval($svc->patient_payable);
                    $alreadyPaid  = floatval($svc->MontantPayer);
                    $stillOwed    = max(0, $patientPart - $alreadyPaid);
                    $applyAmt     = min($stillOwed, $dispatchable);
                    $dispatchable -= $applyAmt;
                    $newMontantPaye = round($alreadyPaid + $applyAmt, 3);
                    $newStatut = match(true) {
                        $newMontantPaye >= $patientPart => 'PAYE',
                        $newMontantPaye > 0             => 'PARTIELLEMENT_PAYE',
                        default                         => 'EN_ATTENTE',
                    };
                    Facture::where('IDgen_mst_facture', $svc->IDgen_mst_facture)->update([
                        'MontantPayer'   => $newMontantPaye,
                        'MontantRestant' => max(0, round($patientPart - $newMontantPaye, 3)),
                        'StatutPaiement' => $newStatut,
                    ]);
                }

                // Enregistrement paiement
                DB::table('bill_txn_patient_payments')->insert([
                    'patient_id'         => $patientId,
                    'payment_date'       => now()->toDateString(),
                    'paid_amount'        => $applyToBill,
                    'total_amount'       => floatval($bill->bill_amount),
                    'cash_amount'        => $cashAmt   > 0 ? round($cashAmt   * $applyToBill / $totalPaye, 3) : 0,
                    'card_amount'        => $cardAmt   > 0 ? round($cardAmt   * $applyToBill / $totalPaye, 3) : 0,
                    'cheque_amount'      => $chequeAmt > 0 ? round($chequeAmt * $applyToBill / $totalPaye, 3) : 0,
                    'mobile_amount'      => $mobAmt    > 0 ? round($mobAmt    * $applyToBill / $totalPaye, 3) : 0,
                    'mode_paye'          => implode('+', $modes),
                    'created_dttm'       => now(),
                    'paiment_id_numeric' => (DB::table('bill_txn_patient_payments')->max('paiment_id_numeric') ?? 0) + 1,
                ]);

                $billsSettled++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$billsSettled} facture(s) soldée(s) avec succès.",
                'data'    => ['bills_settled' => $billsSettled, 'remaining_unallocated' => max(0, $remaining)],
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur lors du traitement.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mettre une facture en attente.
     */
    public function mettreEnAttente(int $billId): JsonResponse
    {
        $bill = BillHeader::find($billId);
        if (!$bill) {
            return response()->json(['success' => false, 'message' => 'Facture introuvable'], 404);
        }
        $bill->update(['bill_status_id' => 1]);
        Facture::where('bill_id', $billId)->update(['StatutPaiement' => 'EN_ATTENTE']);

        return response()->json(['success' => true, 'message' => 'Facture mise en attente.']);
    }
}
