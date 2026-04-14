<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillDetail;
use App\Models\BillHeader;
use App\Models\Facture;
use App\Models\Patient;
use App\Models\Personnel;
use App\Models\VisiteAdt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VisiteController extends Controller
{
    /**
     * Liste des visites avec pagination et recherche
     */
    public function index(Request $request): JsonResponse
    {
        $query = VisiteAdt::with(['patient'])
            ->orderByDesc('created_dttm');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('patient_name', 'ilike', "%{$search}%")
                  ->orWhere('patient_id', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('patient_pin')) {
            $query->where('patient_pin', $request->patient_pin);
        }

        if ($request->filled('doctor_id')) {
            $query->where('consulting_doctor_id', $request->doctor_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('visit_datetime', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('visit_datetime', '<=', $request->date_to);
        }

        $visites = $query->paginate($request->get('per_page', 20));

        return response()->json(['success' => true, 'data' => $visites]);
    }

    /**
     * Détails d'une visite
     */
    public function show(VisiteAdt $visite): JsonResponse
    {
        $visite->load(['patient', 'factures', 'billHeader.details']);

        return response()->json(['success' => true, 'data' => $visite]);
    }

    /**
     * Création visite + facture en transaction
     *
     * Body attendu :
     * {
     *   "patient_pin": "PAT-XXXXXXXX",
     *   "consulting_doctor_id": "PERS-XXX",
     *   "visit_type": "OPD",
     *   "hospital_id": "HOSP-XXX",
     *   "visit_place": "Clinic visit",
     *   "IDgen_mst_Departement": "DEPT-XXX",
     *   "refered_doctor": null,
     *   "refered_hospital": null,
     *   "numero_medcin": null,
     *   "societe": null,
     *   "ref_pc": null,
     *   "date": "2026-04-14",
     *   "Lien_Parente": null,
     *   "prise_en_charge": false,
     *   "contrat_pol": false,
     *   "attestation": false,
     *   "urgence": false,
     *   "services": [
     *     { "service_id": "SRV-XXX", "description": "Consultation", "service_type_id": "TS-X",
     *       "prix": 5000, "quantite": 1, "couverture_pct": 80 }
     *   ]
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_pin'           => 'required|string|exists:gen_mst_patient,patient_id',
            'consulting_doctor_id'  => 'nullable|string',
            'visit_type'            => 'nullable|string|max:50',
            'hospital_id'           => 'nullable|string|max:20',
            'visit_place'           => 'nullable|string|max:100',
            'IDgen_mst_Departement' => 'nullable|string|max:20',
            'refered_doctor'        => 'nullable|string|max:200',
            'refered_hospital'      => 'nullable|string|max:200',
            'numero_medcin'         => 'nullable|string|max:50',
            'societe'               => 'nullable|string|max:100',
            'ref_pc'                => 'nullable|string|max:50',
            'date'                  => 'nullable|date',
            'Lien_Parente'          => 'nullable|string|max:50',
            'prise_en_charge'       => 'boolean',
            'contrat_pol'           => 'boolean',
            'attestation'           => 'boolean',
            'urgence'               => 'boolean',
            'Hospitaliser'          => 'boolean',
            'services'              => 'required|array|min:1',
            'services.*.service_id'     => 'required|string',
            'services.*.description'    => 'nullable|string|max:400',
            'services.*.service_type_id'=> 'nullable|string|max:20',
            'services.*.prix'           => 'required|numeric|min:0',
            'services.*.quantite'       => 'required|integer|min:1',
            'services.*.couverture_pct' => 'nullable|numeric|min:0|max:100',
        ]);

        $patient   = Patient::where('patient_id', $validated['patient_pin'])->firstOrFail();
        $userId    = auth()?->user()?->id ?? 'SYSTEM';
        $now       = now();
        $today     = $now->toDateString();

        // ── Contrôle : pas deux visites le même jour pour le même patient ──
        $dejaVisite = VisiteAdt::where('patient_pin', $validated['patient_pin'])
            ->whereDate('visit_datetime', $today)
            ->exists();

        if ($dejaVisite) {
            return response()->json([
                'success' => false,
                'message' => "Ce patient a déjà une visite enregistrée aujourd'hui ({$today}). Une seule visite par jour est autorisée.",
            ], 422);
        }

        // Calculs des montants
        $services = $validated['services'];
        $totalBrut = 0;
        $totalCompagny = 0;
        $totalPatient  = 0;

        foreach ($services as &$svc) {
            $prixTotal = $svc['prix'] * $svc['quantite'];
            $pct       = $svc['couverture_pct'] ?? 0;

            $partCompagny = round($prixTotal * $pct / 100, 3);
            $partPatient  = round($prixTotal - $partCompagny, 3);

            $svc['total_price']     = $prixTotal;
            $svc['part_compagny']   = $partCompagny;
            $svc['part_patient']    = $partPatient;

            $totalBrut     += $prixTotal;
            $totalCompagny += $partCompagny;
            $totalPatient  += $partPatient;
        }
        unset($svc);

        try {
            DB::beginTransaction();

            // ── 1. Visite (clinic_txn_adt) ────────────────────────────
            $visite = VisiteAdt::create([
                'patient_pin'           => $validated['patient_pin'],
                'visit_datetime'        => $now,
                'consulting_doctor_id'  => $validated['consulting_doctor_id'] ?? null,
                'visit_type'            => $validated['visit_type'] ?? 'OPD',
                'hospital_id'           => $validated['hospital_id'] ?? null,
                'created_user_id'       => $userId,
                'created_dttm'          => $now,
                'doctor_seen'           => 0, // 0 = En attente, 1 = Vu
                'bill_amount'           => $totalBrut,
                'refered_doctor'        => $validated['refered_doctor'] ?? null,
                'refered_hospital'      => $validated['refered_hospital'] ?? null,
                'numero_medcin'         => $validated['numero_medcin'] ?? null,
                'visit_place'           => $validated['visit_place'] ?? null,
                'ID_Compagny'           => $patient->company_id,
                'ID_TypeCouverture'     => $patient->type_couverture,
                'prise_en_charge'       => $validated['prise_en_charge'] ?? false,
                'contrat_pol'           => $validated['contrat_pol'] ?? false,
                'attestation'           => $validated['attestation'] ?? false,
                'societe'               => $validated['societe'] ?? null,
                'ref_pc'                => $validated['ref_pc'] ?? null,
                'date'                  => $validated['date'] ?? $today,
                'Lien_Parente'          => $validated['Lien_Parente'] ?? null,
                'urgence'               => $validated['urgence'] ?? false,
                'Hospitaliser'          => $validated['Hospitaliser'] ?? false,
                'IDgen_mst_Departement' => $validated['IDgen_mst_Departement'] ?? null,
                'Total_a_payer'         => $totalBrut,
                'montant_patient'       => $totalPatient,
                'montant_compagny'      => $totalCompagny,
            ]);

            // ── 2. Entête facture (bill_txn_bill_hd) ──────────────────
            $billNo  = $this->genererBillNo($today);
            $billHd  = BillHeader::create([
                'bill_no'          => $billNo,
                'bill_date'        => $today,
                'patient_id'       => $patient->patient_id,
                'bill_amount'      => $totalBrut,
                'discount_amount'  => 0,
                'net_amount'       => $totalBrut,
                'created_dttm'     => $now,
                'created_user_id'  => $userId,
                'bill_status_id'   => 1,
                'paid_amount'      => 0,
                'pending_amount'   => $totalPatient,
                'cash_amount'      => 0,
                'card_amount'      => 0,
                'cheque_amount'    => 0,
                'bill_id_numeric'  => $this->genererBillNumeric(),
                'adt_id'           => $visite->adt_id,
            ]);

            // ── 3. Détails facture (bill_txn_bill_details) ────────────
            foreach ($services as $idx => $svc) {
                BillDetail::create([
                    'bill_hd_id'      => $billHd->bill_hd_id,
                    'service_id'      => $svc['service_id'],
                    'service_price'   => $svc['prix'],
                    'service_qty'     => $svc['quantite'],
                    'total_price'     => $svc['total_price'],
                    'net_amount'      => $svc['total_price'],
                    'discount_amount' => 0,
                    'service_type_id' => $svc['service_type_id'] ?? null,
                    'created_dttm'    => $now,
                    'created_user_id' => $userId,
                    'sr_no'           => $idx + 1,
                ]);
            }

            // ── 4. gen_mst_facture (une ligne par service) ────────────
            foreach ($services as $svc) {
                Facture::create([
                    'NomDescription'         => $svc['description'] ?? $svc['service_id'],
                    'PrixService'            => $svc['prix'],
                    'IDService'              => $svc['service_id'],
                    'adt_id'                 => $visite->adt_id,
                    'patient_id'             => $patient->patient_id,
                    'MontantPayer'           => 0,
                    'MontantRestant'         => $svc['part_patient'],
                    'compagny_id'            => $patient->company_id,
                    'MontantTotalFacture'    => $svc['total_price'],
                    'StatutPaiement'         => 'EN_ATTENTE',
                    'DateCreation'           => $now,
                    'docteur_id'             => $validated['consulting_doctor_id'] ?? null,
                    'MontantPartenaire'      => $svc['part_compagny'],
                    'TypeService'            => $svc['service_type_id'] ?? null,
                    'patient_payable'        => $svc['part_patient'],
                    'bill_id'                => $billHd->bill_hd_id,
                    'MontantpayerPartenaire' => 0,
                ]);
            }

            DB::commit();

            $visite->load(['patient', 'factures', 'billHeader.details']);

            return response()->json([
                'success' => true,
                'message' => 'Visite créée avec succès.',
                'data'    => [
                    'visite'   => $visite,
                    'bill_no'  => $billNo,
                    'totaux'   => [
                        'total'    => $totalBrut,
                        'patient'  => $totalPatient,
                        'compagny' => $totalCompagny,
                    ],
                ],
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la visite.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Métadonnées : lieux, types de visite, liens de parenté
     */
    public function metadata(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'visit_places' => [
                    ['value' => 'Clinic visit',   'label' => 'Clinic visit'],
                    ['value' => 'Home visit',      'label' => 'Visite domicile'],
                    ['value' => 'Telemedicine',    'label' => 'Télémédecine'],
                    ['value' => 'Emergency',       'label' => 'Urgence'],
                ],
                'visit_types' => [
                    ['value' => 'OPD',  'label' => 'Consultation externe'],
                    ['value' => 'IPD',  'label' => 'Hospitalisation'],
                    ['value' => 'EMRG', 'label' => 'Urgence'],
                ],
                'liens_parente' => [
                    ['value' => 'Assuré Principal', 'label' => 'Assuré Principal'],
                    ['value' => 'Conjoint',          'label' => 'Conjoint(e)'],
                    ['value' => 'Enfant',            'label' => 'Enfant'],
                    ['value' => 'Parent',            'label' => 'Parent'],
                    ['value' => 'Autre',             'label' => 'Autre'],
                ],
            ],
        ]);
    }

    /**
     * Salle d'attente — visites en cours avec filtres
     */
    public function salleAttente(Request $request): JsonResponse
    {
        $query = VisiteAdt::with(['patient', 'medecin'])
            ->orderByDesc('created_dttm');

        // Filtre statut : 0 = en attente, 1 = vu, all = tous
        $statut = $request->get('statut', 'all');
        if ($statut === '0') {
            $query->where('doctor_seen', 0);
        } elseif ($statut === '1') {
            $query->where('doctor_seen', 1);
        }

        // Filtre date (par défaut : aujourd'hui)
        $date = $request->get('date', now()->toDateString());
        if ($date) {
            $query->whereDate('created_dttm', $date);
        }

        // Filtre priorité : urgence | normal | opd | ipd | emrg | all
        $priorite = $request->get('priorite', 'all');
        if ($priorite === 'urgence') {
            $query->where('urgence', true);
        } elseif ($priorite === 'normal') {
            $query->where('urgence', false)->where('visit_type', 'OPD');
        } elseif ($priorite === 'hospitalisation') {
            $query->where('visit_type', 'IPD');
        }

        // Recherche patient
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('patient_name', 'ilike', "%{$search}%")
                  ->orWhere('patient_id',   'ilike', "%{$search}%")
                  ->orWhere('patient_code', 'ilike', "%{$search}%");
            });
        }

        // Récupérer TOUTES les visites du jour (sans filtre priorité) pour les compteurs
        $toutesVisites = VisiteAdt::whereDate('created_dttm', $date ?? now()->toDateString())->get();

        $visites = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $visites,
            'meta'    => [
                'total'           => $toutesVisites->count(),
                'en_attente'      => $toutesVisites->where('doctor_seen', 0)->count(),
                'vus'             => $toutesVisites->where('doctor_seen', 1)->count(),
                'urgences'        => $toutesVisites->where('urgence', true)->count(),
                'normaux'         => $toutesVisites->where('urgence', false)->where('visit_type', 'OPD')->count(),
                'hospitalisations'=> $toutesVisites->where('visit_type', 'IPD')->count(),
            ],
        ]);
    }

    /**
     * Marquer un patient comme vu par le médecin
     */
    public function marquerVu(VisiteAdt $visite): JsonResponse
    {
        $visite->update(['doctor_seen' => 1]);

        return response()->json([
            'success' => true,
            'message' => 'Patient marqué comme vu.',
            'data'    => $visite->fresh(['patient', 'medecin']),
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function genererBillNo(string $date): string
    {
        $prefix  = 'BILL-' . str_replace('-', '', $date) . '-';
        $last    = BillHeader::where('bill_no', 'like', $prefix . '%')
                             ->orderByDesc('bill_hd_id')
                             ->value('bill_no');
        $seq = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;
        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    private function genererBillNumeric(): int
    {
        return (int) (BillHeader::max('bill_id_numeric') ?? 0) + 1;
    }
}
