<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdtNote;
use App\Models\BillHeader;
use App\Models\ConsultationMedication;
use App\Models\ConsultationProcedure;
use App\Models\Facture;
use App\Models\LabProcedure;
use App\Models\LongTermMedication;
use App\Models\Patient;
use App\Models\PatientNote;
use App\Models\VisiteAdt;
use App\Models\VitalSign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * ConsultationController
 *
 * Gère la fiche de consultation complète (Cls_Patient_Quick_Notes_New) :
 *  - Signes vitaux          → VitalSign
 *  - Notes ADT              → AdtNote
 *  - Notes patient          → PatientNote
 *  - Prescriptions          → ConsultationMedication
 *  - Actes / procédures     → ConsultationProcedure
 *  - Examens labo           → LabProcedure
 *  - Traitements chroniques → LongTermMedication
 *
 * Routes préfixées :  /api/v1/consultations/{adt_id}/...
 */
class ConsultationController extends Controller
{
    // ═══════════════════════════════════════════════════════════════════════
    //  FICHE GLOBALE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * GET /consultations/{adt_id}
     * Retourne la fiche complète d'une consultation (Cls_Patient_Quick_Notes_New).
     */
    public function show(VisiteAdt $visite): JsonResponse
    {
        $visite->load([
            'patient',
            'medecin',
            'adtNotes',
            'patientNotes',
            'vitalSigns',
            'medications',
            'procedures',
            'labProcedures',
        ]);

        $patient = $visite->patient;
        $longTermMeds = $patient
            ? LongTermMedication::where('patient_id', $patient->patient_id)
                ->where('status_id', 1)
                ->orderByDesc('created_dttm')
                ->get()
            : collect();

        return response()->json([
            'success' => true,
            'data'    => [
                'objadtdetails'          => $visite,
                'objvitalsigns'          => $visite->vitalSigns->last(),   // dernier enregistrement
                'objadtnotes'            => $visite->adtNotes,
                'objpatientnotes'        => $visite->patientNotes,
                'objmedication_v'        => $visite->medications,
                'objprocedures_v'        => $visite->procedures,
                'objlabprocedures_v'     => $visite->labProcedures,
                'objlongtermmedication'  => $longTermMeds,
            ],
        ]);
    }

    /**
     * POST /consultations/{adt_id}/sauvegarder
     * Sauvegarde complète de la fiche (toutes les sections en une seule requête).
     *
     * Body attendu :
     * {
     *   "vitalsigns":     { température, pouls, tension… },
     *   "adt_notes":      [{ adt_notes, adt_note_template_id }],
     *   "patient_notes":  [{ patient_notes, adt_note_template_id }],
     *   "medications":    [{ item_id, item_name, dosage, frequency, duration, duration_type, usage, food_type, doctor_notes }],
     *   "procedures":     [{ procedure_code, procedure_name, procedure_type, description, doctor_notes, cost }],
     *   "lab_procedures": [{ lab_test_code, lab_test_name, lab_category, doctor_notes, cost }],
     *   "long_term_meds": [{ item_id, item_name, med_start_date, med_end_date, duration, duration_type, usage, food_type, doctor_notes }]
     * }
     */
    public function sauvegarder(Request $request, VisiteAdt $visite): JsonResponse
    {
        $userId    = auth()?->user()?->id ?? 'SYSTEM';
        $patientId = $visite->patient_pin;
        $adtId     = $visite->adt_id;
        $hospitalId = $visite->hospital_id;
        $now       = now();

        try {
            DB::beginTransaction();

            // ── 1. Signes vitaux ──────────────────────────────────────────
            if ($request->has('vitalsigns') && is_array($request->vitalsigns)) {
                $vs = $request->vitalsigns;
                // Calculer BMI si poids + taille fournis
                $bmi = null;
                if (!empty($vs['weights']) && !empty($vs['height']) && $vs['height'] > 0) {
                    $h   = $vs['height'] / 100;
                    $bmi = round($vs['weights'] / ($h * $h), 2);
                }
                VitalSign::create([
                    'patient_id'      => $patientId,
                    'adt_id'          => $adtId,
                    'hospital_id'     => $hospitalId,
                    'temperature_f'   => $vs['temperature_f'] ?? null,
                    'temperature_c'   => $vs['temperature_c'] ?? null,
                    'pulse'           => $vs['pulse'] ?? null,
                    'respiration'     => $vs['respiration'] ?? null,
                    'bp_systolic_r'   => $vs['bp_systolic_r'] ?? null,
                    'bp_diastolic_r'  => $vs['bp_diastolic_r'] ?? null,
                    'bp_systolic_l'   => $vs['bp_systolic_l'] ?? null,
                    'bp_diastolic_l'  => $vs['bp_diastolic_l'] ?? null,
                    'weights'         => $vs['weights'] ?? null,
                    'height'          => $vs['height'] ?? null,
                    'bmi'             => $vs['bmi'] ?? $bmi,
                    'spo_2'           => $vs['spo_2'] ?? null,
                    'created_user_id' => $userId,
                    'created_dttm'    => $now,
                ]);
            }

            // ── 2. Notes ADT ──────────────────────────────────────────────
            if ($request->has('adt_notes') && is_array($request->adt_notes)) {
                foreach ($request->adt_notes as $note) {
                    if (empty($note['adt_notes'])) continue;
                    AdtNote::create([
                        'patient_id'           => $patientId,
                        'adt_id'               => $adtId,
                        'adt_notes'            => $note['adt_notes'],
                        'adt_note_template_id' => $note['adt_note_template_id'] ?? null,
                        'hospital_id'          => $hospitalId,
                        'created_user_id'      => $userId,
                        'created_dttm'         => $now,
                    ]);
                }
            }

            // ── 3. Notes patient ──────────────────────────────────────────
            if ($request->has('patient_notes') && is_array($request->patient_notes)) {
                foreach ($request->patient_notes as $note) {
                    if (empty($note['patient_notes'])) continue;
                    PatientNote::create([
                        'patient_id'           => $patientId,
                        'adt_id'               => $adtId,
                        'patient_notes'        => $note['patient_notes'],
                        'adt_note_template_id' => $note['adt_note_template_id'] ?? null,
                        'hospital_id'          => $hospitalId,
                        'created_user_id'      => $userId,
                        'created_dttm'         => $now,
                    ]);
                }
            }

            // ── 4. Prescriptions ─────────────────────────────────────────
            if ($request->has('medications') && is_array($request->medications)) {
                foreach ($request->medications as $med) {
                    if (empty($med['item_name'])) continue;
                    ConsultationMedication::create([
                        'patient_id'      => $patientId,
                        'adt_id'          => $adtId,
                        'hospital_id'     => $hospitalId,
                        'item_id'         => $med['item_id'] ?? null,
                        'item_name'       => $med['item_name'],
                        'dosage'          => $med['dosage'] ?? null,
                        'frequency'       => $med['frequency'] ?? null,
                        'duration'        => $med['duration'] ?? null,
                        'duration_type'   => $med['duration_type'] ?? null,
                        'usage'           => $med['usage'] ?? null,
                        'food_type'       => $med['food_type'] ?? null,
                        'doctor_notes'    => $med['doctor_notes'] ?? null,
                        'status_id'       => 1,
                        'created_user_id' => $userId,
                        'created_dttm'    => $now,
                    ]);
                }
            }

            // ── 5. Actes / procédures cliniques ───────────────────────────
            if ($request->has('procedures') && is_array($request->procedures)) {
                foreach ($request->procedures as $proc) {
                    if (empty($proc['procedure_name'])) continue;
                    $newProc = ConsultationProcedure::create([
                        'patient_id'      => $patientId,
                        'adt_id'          => $adtId,
                        'hospital_id'     => $hospitalId,
                        'procedure_code'  => $proc['procedure_code'] ?? null,
                        'procedure_name'  => $proc['procedure_name'],
                        'procedure_type'  => $proc['procedure_type'] ?? null,
                        'description'     => $proc['description'] ?? null,
                        'doctor_notes'    => $proc['doctor_notes'] ?? null,
                        'cost'            => $proc['cost'] ?? 0,
                        'result'          => $proc['result'] ?? null,
                        'status_id'       => $proc['status_id'] ?? 1,
                        'created_user_id' => $userId,
                        'created_dttm'    => $now,
                    ]);
                    // Facturation si coût renseigné
                    $this->ajouterLigneFacture(
                        $visite,
                        $newProc->procedure_name,
                        (float) ($newProc->cost ?? 0),
                        $newProc->procedure_type ?? 'BILAN',
                        $newProc->procedure_id
                    );
                }
            }

            // ── 6. Examens labo ───────────────────────────────────────────
            if ($request->has('lab_procedures') && is_array($request->lab_procedures)) {
                foreach ($request->lab_procedures as $lab) {
                    if (empty($lab['lab_test_name'])) continue;
                    $newLab = LabProcedure::create([
                        'patient_id'      => $patientId,
                        'adt_id'          => $adtId,
                        'hospital_id'     => $hospitalId,
                        'lab_test_code'   => $lab['lab_test_code'] ?? null,
                        'lab_test_name'   => $lab['lab_test_name'],
                        'lab_category'    => $lab['lab_category'] ?? null,
                        'result'          => $lab['result'] ?? null,
                        'unit'            => $lab['unit'] ?? null,
                        'normal_range'    => $lab['normal_range'] ?? null,
                        'result_status'   => $lab['result_status'] ?? null,
                        'doctor_notes'    => $lab['doctor_notes'] ?? null,
                        'cost'            => $lab['cost'] ?? 0,
                        'status_id'       => $lab['status_id'] ?? 1,
                        'result_date'     => $lab['result_date'] ?? null,
                        'created_user_id' => $userId,
                        'created_dttm'    => $now,
                    ]);
                    // Facturation si coût renseigné
                    $this->ajouterLigneFacture(
                        $visite,
                        $newLab->lab_test_name,
                        (float) ($newLab->cost ?? 0),
                        'LAB',
                        $newLab->lab_procedure_id
                    );
                }
            }

            // ── 7. Traitements chroniques ─────────────────────────────────
            if ($request->has('long_term_meds') && is_array($request->long_term_meds)) {
                foreach ($request->long_term_meds as $med) {
                    if (empty($med['item_name'])) continue;
                    LongTermMedication::create([
                        'patient_id'      => $patientId,
                        'item_id'         => $med['item_id'] ?? null,
                        'item_name'       => $med['item_name'],
                        'med_start_date'  => $med['med_start_date'] ?? now()->toDateString(),
                        'med_end_date'    => $med['med_end_date'] ?? null,
                        'duration'        => $med['duration'] ?? null,
                        'duration_type'   => $med['duration_type'] ?? null,
                        'usage'           => $med['usage'] ?? null,
                        'food_type'       => $med['food_type'] ?? null,
                        'doctor_notes'    => $med['doctor_notes'] ?? null,
                        'status_id'       => 1,
                        'created_user_id' => $userId,
                        'created_dttm'    => $now,
                    ]);
                }
            }

            // ── 8. Marquer le patient comme vu ────────────────────────────
            $visite->update(['doctor_seen' => 1]);

            DB::commit();

            // Retourner la fiche complète mise à jour
            return $this->show($visite);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la sauvegarde de la consultation.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SIGNES VITAUX
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /consultations/{adt_id}/vitalsigns */
    public function indexVitalSigns(VisiteAdt $visite): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $visite->vitalSigns()->orderByDesc('vital_sign_id')->get(),
        ]);
    }

    /** POST /consultations/{adt_id}/vitalsigns */
    public function storeVitalSign(Request $request, VisiteAdt $visite): JsonResponse
    {
        $v = $request->validate([
            'temperature_f'  => 'nullable|numeric',
            'temperature_c'  => 'nullable|numeric',
            'pulse'          => 'nullable|numeric',
            'respiration'    => 'nullable|numeric',
            'bp_systolic_r'  => 'nullable|numeric',
            'bp_diastolic_r' => 'nullable|numeric',
            'bp_systolic_l'  => 'nullable|numeric',
            'bp_diastolic_l' => 'nullable|numeric',
            'weights'        => 'nullable|numeric',
            'height'         => 'nullable|numeric',
            'bmi'            => 'nullable|numeric',
            'spo_2'          => 'nullable|numeric',
        ]);

        // Calcul BMI automatique
        if (!empty($v['weights']) && !empty($v['height']) && $v['height'] > 0) {
            $h        = $v['height'] / 100;
            $v['bmi'] = round($v['weights'] / ($h * $h), 2);
        }

        $vs = VitalSign::create(array_merge($v, [
            'patient_id'      => $visite->patient_pin,
            'adt_id'          => $visite->adt_id,
            'hospital_id'     => $visite->hospital_id,
            'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            'created_dttm'    => now(),
        ]));

        return response()->json(['success' => true, 'data' => $vs], 201);
    }

    /** PUT /consultations/{adt_id}/vitalsigns/{vitalSign} */
    public function updateVitalSign(Request $request, VisiteAdt $visite, VitalSign $vitalSign): JsonResponse
    {
        $v = $request->validate([
            'temperature_f'  => 'nullable|numeric',
            'temperature_c'  => 'nullable|numeric',
            'pulse'          => 'nullable|numeric',
            'respiration'    => 'nullable|numeric',
            'bp_systolic_r'  => 'nullable|numeric',
            'bp_diastolic_r' => 'nullable|numeric',
            'bp_systolic_l'  => 'nullable|numeric',
            'bp_diastolic_l' => 'nullable|numeric',
            'weights'        => 'nullable|numeric',
            'height'         => 'nullable|numeric',
            'bmi'            => 'nullable|numeric',
            'spo_2'          => 'nullable|numeric',
        ]);

        $w = $v['weights'] ?? $vitalSign->weights;
        $h = $v['height']  ?? $vitalSign->height;
        if ($w && $h && $h > 0) {
            $hm       = $h / 100;
            $v['bmi'] = round($w / ($hm * $hm), 2);
        }

        $vitalSign->update($v);
        return response()->json(['success' => true, 'data' => $vitalSign->fresh()]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  NOTES ADT
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /consultations/{adt_id}/adt-notes */
    public function indexAdtNotes(VisiteAdt $visite): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $visite->adtNotes()->orderByDesc('adt_notes_id')->get()]);
    }

    /** POST /consultations/{adt_id}/adt-notes */
    public function storeAdtNote(Request $request, VisiteAdt $visite): JsonResponse
    {
        $v = $request->validate([
            'adt_notes'            => 'required|string',
            'adt_note_template_id' => 'nullable|integer',
        ]);
        $note = AdtNote::create(array_merge($v, [
            'patient_id'      => $visite->patient_pin,
            'adt_id'          => $visite->adt_id,
            'hospital_id'     => $visite->hospital_id,
            'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            'created_dttm'    => now(),
        ]));
        return response()->json(['success' => true, 'data' => $note], 201);
    }

    /** PUT /consultations/{adt_id}/adt-notes/{adtNote} */
    public function updateAdtNote(Request $request, VisiteAdt $visite, AdtNote $adtNote): JsonResponse
    {
        $v = $request->validate(['adt_notes' => 'required|string', 'adt_note_template_id' => 'nullable|integer']);
        $adtNote->update($v);
        return response()->json(['success' => true, 'data' => $adtNote->fresh()]);
    }

    /** DELETE /consultations/{adt_id}/adt-notes/{adtNote} */
    public function destroyAdtNote(VisiteAdt $visite, AdtNote $adtNote): JsonResponse
    {
        $adtNote->delete();
        return response()->json(['success' => true, 'message' => 'Note supprimée.']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  NOTES PATIENT
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /consultations/{adt_id}/patient-notes */
    public function indexPatientNotes(VisiteAdt $visite): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $visite->patientNotes()->orderByDesc('patient_notes_id')->get()]);
    }

    /** POST /consultations/{adt_id}/patient-notes */
    public function storePatientNote(Request $request, VisiteAdt $visite): JsonResponse
    {
        $v = $request->validate([
            'patient_notes'        => 'required|string',
            'adt_note_template_id' => 'nullable|integer',
        ]);
        $note = PatientNote::create(array_merge($v, [
            'patient_id'      => $visite->patient_pin,
            'adt_id'          => $visite->adt_id,
            'hospital_id'     => $visite->hospital_id,
            'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            'created_dttm'    => now(),
        ]));
        return response()->json(['success' => true, 'data' => $note], 201);
    }

    /** PUT /consultations/{adt_id}/patient-notes/{patientNote} */
    public function updatePatientNote(Request $request, VisiteAdt $visite, PatientNote $patientNote): JsonResponse
    {
        $v = $request->validate(['patient_notes' => 'required|string', 'adt_note_template_id' => 'nullable|integer']);
        $patientNote->update($v);
        return response()->json(['success' => true, 'data' => $patientNote->fresh()]);
    }

    /** DELETE /consultations/{adt_id}/patient-notes/{patientNote} */
    public function destroyPatientNote(VisiteAdt $visite, PatientNote $patientNote): JsonResponse
    {
        $patientNote->delete();
        return response()->json(['success' => true, 'message' => 'Note supprimée.']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PRESCRIPTIONS (MÉDICAMENTS DE LA CONSULTATION)
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /consultations/{adt_id}/medications */
    public function indexMedications(VisiteAdt $visite): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $visite->medications()->orderByDesc('medication_id')->get()]);
    }

    /** POST /consultations/{adt_id}/medications */
    public function storeMedication(Request $request, VisiteAdt $visite): JsonResponse
    {
        $v = $request->validate([
            'item_id'       => 'nullable|string|max:50',
            'item_name'     => 'required|string|max:200',
            'dosage'        => 'nullable|string|max:100',
            'frequency'     => 'nullable|string|max:100',
            'duration'      => 'nullable|integer|min:1',
            'duration_type' => 'nullable|string|max:20',
            'usage'         => 'nullable|string|max:50',
            'food_type'     => 'nullable|string|max:50',
            'doctor_notes'  => 'nullable|string',
        ]);
        $med = ConsultationMedication::create(array_merge($v, [
            'patient_id'      => $visite->patient_pin,
            'adt_id'          => $visite->adt_id,
            'hospital_id'     => $visite->hospital_id,
            'status_id'       => 1,
            'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            'created_dttm'    => now(),
        ]));
        return response()->json(['success' => true, 'data' => $med], 201);
    }

    /** PUT /consultations/{adt_id}/medications/{medication} */
    public function updateMedication(Request $request, VisiteAdt $visite, ConsultationMedication $medication): JsonResponse
    {
        $v = $request->validate([
            'item_id'       => 'nullable|string|max:50',
            'item_name'     => 'sometimes|string|max:200',
            'dosage'        => 'nullable|string|max:100',
            'frequency'     => 'nullable|string|max:100',
            'duration'      => 'nullable|integer|min:1',
            'duration_type' => 'nullable|string|max:20',
            'usage'         => 'nullable|string|max:50',
            'food_type'     => 'nullable|string|max:50',
            'doctor_notes'  => 'nullable|string',
            'status_id'     => 'nullable|integer|in:0,1',
        ]);
        $medication->update($v);
        return response()->json(['success' => true, 'data' => $medication->fresh()]);
    }

    /** DELETE /consultations/{adt_id}/medications/{medication} */
    public function destroyMedication(VisiteAdt $visite, ConsultationMedication $medication): JsonResponse
    {
        $medication->delete();
        return response()->json(['success' => true, 'message' => 'Prescription supprimée.']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PROCÉDURES CLINIQUES
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /consultations/{adt_id}/procedures */
    public function indexProcedures(VisiteAdt $visite): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $visite->procedures()->orderByDesc('procedure_id')->get()]);
    }

    /** POST /consultations/{adt_id}/procedures */
    public function storeProcedure(Request $request, VisiteAdt $visite): JsonResponse
    {
        $v = $request->validate([
            'procedure_code' => 'nullable|string|max:50',
            'procedure_name' => 'required|string|max:200',
            'procedure_type' => 'nullable|string|max:50',
            'description'    => 'nullable|string',
            'doctor_notes'   => 'nullable|string',
            'cost'           => 'nullable|numeric|min:0',
            'result'         => 'nullable|string',
            'status_id'      => 'nullable|integer|in:0,1,2',
        ]);
        $proc = ConsultationProcedure::create(array_merge($v, [
            'patient_id'      => $visite->patient_pin,
            'adt_id'          => $visite->adt_id,
            'hospital_id'     => $visite->hospital_id,
            'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            'created_dttm'    => now(),
        ]));

        // ── Facturation automatique ───────────────────────────────────────
        $this->ajouterLigneFacture(
            $visite,
            $proc->procedure_name,
            (float) ($proc->cost ?? 0),
            $proc->procedure_type ?? 'BILAN',
            $proc->procedure_id
        );

        return response()->json(['success' => true, 'data' => $proc], 201);
    }

    /** PUT /consultations/{adt_id}/procedures/{procedure} */
    public function updateProcedure(Request $request, VisiteAdt $visite, ConsultationProcedure $procedure): JsonResponse
    {
        $v = $request->validate([
            'procedure_code' => 'nullable|string|max:50',
            'procedure_name' => 'sometimes|string|max:200',
            'procedure_type' => 'nullable|string|max:50',
            'description'    => 'nullable|string',
            'doctor_notes'   => 'nullable|string',
            'cost'           => 'nullable|numeric|min:0',
            'result'         => 'nullable|string',
            'status_id'      => 'nullable|integer|in:0,1,2',
        ]);

        $ancienCout  = (float) ($procedure->cost ?? 0);
        $ancienType  = $procedure->procedure_type ?? 'BILAN';
        $ancienNom   = $procedure->procedure_name;

        $procedure->update($v);
        $p = $procedure->fresh();

        // ── Ajustement facturation si le coût a changé ───────────────────
        $nouveauCout = (float) ($p->cost ?? 0);
        $this->mettreAJourLigneFacture(
            $visite,
            $p->procedure_id,
            $p->procedure_type ?? $ancienType,
            $ancienCout,
            $nouveauCout,
            $p->procedure_name ?? $ancienNom
        );

        return response()->json(['success' => true, 'data' => $p]);
    }

    /** DELETE /consultations/{adt_id}/procedures/{procedure} */
    public function destroyProcedure(VisiteAdt $visite, ConsultationProcedure $procedure): JsonResponse
    {
        // ── Retirer la ligne de facturation avant suppression ────────────
        $this->retirerLigneFacture(
            $visite,
            $procedure->procedure_id,
            $procedure->procedure_type ?? 'BILAN'
        );

        $procedure->delete();
        return response()->json(['success' => true, 'message' => 'Procédure supprimée.']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  EXAMENS DE LABORATOIRE
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /consultations/{adt_id}/lab-procedures */
    public function indexLabProcedures(VisiteAdt $visite): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $visite->labProcedures()->orderByDesc('lab_procedure_id')->get()]);
    }

    /** POST /consultations/{adt_id}/lab-procedures */
    public function storeLabProcedure(Request $request, VisiteAdt $visite): JsonResponse
    {
        $v = $request->validate([
            'lab_test_code' => 'nullable|string|max:50',
            'lab_test_name' => 'required|string|max:200',
            'lab_category'  => 'nullable|string|max:100',
            'result'        => 'nullable|string',
            'unit'          => 'nullable|string|max:50',
            'normal_range'  => 'nullable|string|max:100',
            'result_status' => 'nullable|string|in:normal,anormal,critique',
            'doctor_notes'  => 'nullable|string',
            'cost'          => 'nullable|numeric|min:0',
            'status_id'     => 'nullable|integer|in:0,1,2',
            'result_date'   => 'nullable|date',
        ]);
        $lab = LabProcedure::create(array_merge($v, [
            'patient_id'      => $visite->patient_pin,
            'adt_id'          => $visite->adt_id,
            'hospital_id'     => $visite->hospital_id,
            'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            'created_dttm'    => now(),
        ]));

        // ── Facturation automatique ───────────────────────────────────────
        $this->ajouterLigneFacture(
            $visite,
            $lab->lab_test_name,
            (float) ($lab->cost ?? 0),
            'LAB',
            $lab->lab_procedure_id
        );

        return response()->json(['success' => true, 'data' => $lab], 201);
    }

    /** PUT /consultations/{adt_id}/lab-procedures/{labProcedure} */
    public function updateLabProcedure(Request $request, VisiteAdt $visite, LabProcedure $labProcedure): JsonResponse
    {
        $v = $request->validate([
            'lab_test_code' => 'nullable|string|max:50',
            'lab_test_name' => 'sometimes|string|max:200',
            'lab_category'  => 'nullable|string|max:100',
            'result'        => 'nullable|string',
            'unit'          => 'nullable|string|max:50',
            'normal_range'  => 'nullable|string|max:100',
            'result_status' => 'nullable|string|in:normal,anormal,critique',
            'doctor_notes'  => 'nullable|string',
            'cost'          => 'nullable|numeric|min:0',
            'status_id'     => 'nullable|integer|in:0,1,2',
            'result_date'   => 'nullable|date',
        ]);

        $ancienCout = (float) ($labProcedure->cost ?? 0);
        $ancienNom  = $labProcedure->lab_test_name;

        $labProcedure->update($v);
        $l = $labProcedure->fresh();

        // ── Ajustement facturation si le coût a changé ───────────────────
        $nouveauCout = (float) ($l->cost ?? 0);
        $this->mettreAJourLigneFacture(
            $visite,
            $l->lab_procedure_id,
            'LAB',
            $ancienCout,
            $nouveauCout,
            $l->lab_test_name ?? $ancienNom
        );

        return response()->json(['success' => true, 'data' => $l]);
    }

    /** DELETE /consultations/{adt_id}/lab-procedures/{labProcedure} */
    public function destroyLabProcedure(VisiteAdt $visite, LabProcedure $labProcedure): JsonResponse
    {
        // ── Retirer la ligne de facturation avant suppression ────────────
        $this->retirerLigneFacture(
            $visite,
            $labProcedure->lab_procedure_id,
            'LAB'
        );

        $labProcedure->delete();
        return response()->json(['success' => true, 'message' => 'Examen labo supprimé.']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  TRAITEMENTS CHRONIQUES (par patient, pas par visite)
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /patients/{patient_id}/long-term-medications */
    public function indexLongTermMeds(string $patientId): JsonResponse
    {
        $meds = LongTermMedication::where('patient_id', $patientId)
            ->orderByDesc('medication_id')
            ->get();
        return response()->json(['success' => true, 'data' => $meds]);
    }

    /** POST /patients/{patient_id}/long-term-medications */
    public function storeLongTermMed(Request $request, string $patientId): JsonResponse
    {
        // Vérifier que le patient existe
        Patient::where('patient_id', $patientId)->firstOrFail();

        $v = $request->validate([
            'item_id'        => 'nullable|string|max:50',
            'item_name'      => 'required|string|max:200',
            'med_start_date' => 'nullable|date',
            'med_end_date'   => 'nullable|date|after_or_equal:med_start_date',
            'duration'       => 'nullable|integer|min:1',
            'duration_type'  => 'nullable|string|max:20',
            'usage'          => 'nullable|string|max:50',
            'food_type'      => 'nullable|string|max:50',
            'doctor_notes'   => 'nullable|string',
        ]);
        $med = LongTermMedication::create(array_merge($v, [
            'patient_id'      => $patientId,
            'status_id'       => 1,
            'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            'created_dttm'    => now(),
        ]));
        return response()->json(['success' => true, 'data' => $med], 201);
    }

    /** PUT /patients/{patient_id}/long-term-medications/{medication} */
    public function updateLongTermMed(Request $request, string $patientId, LongTermMedication $medication): JsonResponse
    {
        $v = $request->validate([
            'item_id'        => 'nullable|string|max:50',
            'item_name'      => 'sometimes|string|max:200',
            'med_start_date' => 'nullable|date',
            'med_end_date'   => 'nullable|date',
            'duration'       => 'nullable|integer|min:1',
            'duration_type'  => 'nullable|string|max:20',
            'usage'          => 'nullable|string|max:50',
            'food_type'      => 'nullable|string|max:50',
            'doctor_notes'   => 'nullable|string',
            'status_id'      => 'nullable|integer|in:0,1',
        ]);
        $medication->update($v);
        return response()->json(['success' => true, 'data' => $medication->fresh()]);
    }

    /** DELETE /patients/{patient_id}/long-term-medications/{medication} */
    public function destroyLongTermMed(string $patientId, LongTermMedication $medication): JsonResponse
    {
        $medication->delete();
        return response()->json(['success' => true, 'message' => 'Traitement chronique supprimé.']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  HELPERS FACTURATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Crée une ligne gen_mst_facture et met à jour BillHeader + VisiteAdt.
     * Appelé quand un examen/procédure avec coût > 0 est ajouté.
     *
     * @param VisiteAdt $visite
     * @param string    $description   Libellé de l'acte (lab_test_name, procedure_name…)
     * @param float     $cout          Montant de l'acte
     * @param string    $typeService   Code type : 'LAB', 'IMAGERIE', 'BILAN', etc.
     * @param int       $procedureId   PK de l'enregistrement (pour retrouver la ligne)
     */
    private function ajouterLigneFacture(
        VisiteAdt $visite,
        string    $description,
        float     $cout,
        string    $typeService,
        int       $procedureId
    ): void {
        if ($cout <= 0) return;

        $now = now();

        // ── Calcul de la part patient / part compagnie depuis les ratios de la visite ──
        $totalVisite = (float) ($visite->Total_a_payer ?? 0);
        $pctCie      = $totalVisite > 0
            ? ((float) ($visite->montant_compagny ?? 0) / $totalVisite)
            : 0;

        $partCie     = round($cout * $pctCie, 3);
        $partPatient = round($cout - $partCie, 3);

        // ── Récupérer le BillHeader de la visite ──────────────────────────
        $billHd = BillHeader::where('adt_id', $visite->adt_id)->first();

        // ── Créer la ligne gen_mst_facture ────────────────────────────────
        $facture = Facture::create([
            'NomDescription'         => $description,
            'PrixService'            => $cout,
            'IDService'              => null,
            'adt_id'                 => $visite->adt_id,
            'patient_id'             => $visite->patient_pin,
            'MontantPayer'           => 0,
            'MontantRestant'         => $partPatient,
            'compagny_id'            => $visite->ID_Compagny,
            'MontantTotalFacture'    => $cout,
            'StatutPaiement'         => 'EN_ATTENTE',
            'DateCreation'           => $now,
            'docteur_id'             => $visite->consulting_doctor_id,
            'MontantPartenaire'      => $partCie,
            'TypeService'            => $typeService,
            'patient_payable'        => $partPatient,
            'bill_id'                => $billHd?->bill_hd_id,
            'ID_Procedure'           => $procedureId,
            'MontantpayerPartenaire' => 0,
        ]);

        // ── Mettre à jour BillHeader ──────────────────────────────────────
        if ($billHd) {
            $billHd->increment('bill_amount',    $cout);
            $billHd->increment('net_amount',     $cout);
            $billHd->increment('pending_amount', $partPatient);
        }

        // ── Mettre à jour VisiteAdt ───────────────────────────────────────
        $visite->increment('bill_amount',      $cout);
        $visite->increment('Total_a_payer',    $cout);
        $visite->increment('montant_patient',  $partPatient);
        $visite->increment('montant_compagny', $partCie);
    }

    /**
     * Supprime la ligne gen_mst_facture liée à un acte et corrige les totaux.
     * Appelé lors de la suppression d'un examen/procédure.
     *
     * @param VisiteAdt $visite
     * @param int       $procedureId  PK de l'enregistrement
     * @param string    $typeService  Filtre pour éviter collisions entre tables
     */
    private function retirerLigneFacture(
        VisiteAdt $visite,
        int       $procedureId,
        string    $typeService
    ): void {
        $facture = Facture::where('adt_id',      $visite->adt_id)
            ->where('ID_Procedure', $procedureId)
            ->where('TypeService',  $typeService)
            ->first();

        if (!$facture) return;

        $cout        = (float) $facture->MontantTotalFacture;
        $partPatient = (float) $facture->patient_payable;
        $partCie     = (float) $facture->MontantPartenaire;

        $facture->delete();

        // ── Corriger BillHeader ───────────────────────────────────────────
        $billHd = BillHeader::where('adt_id', $visite->adt_id)->first();
        if ($billHd) {
            $billHd->decrement('bill_amount',    $cout);
            $billHd->decrement('net_amount',     $cout);
            $billHd->decrement('pending_amount', $partPatient);
        }

        // ── Corriger VisiteAdt ────────────────────────────────────────────
        $visite->decrement('bill_amount',      $cout);
        $visite->decrement('Total_a_payer',    $cout);
        $visite->decrement('montant_patient',  $partPatient);
        $visite->decrement('montant_compagny', $partCie);
    }

    /**
     * Ajuste la ligne gen_mst_facture et les totaux quand le coût change.
     *
     * @param VisiteAdt $visite
     * @param int       $procedureId
     * @param string    $typeService
     * @param float     $ancienCout
     * @param float     $nouveauCout
     * @param string    $description   Nouveau libellé (si renommé)
     */
    private function mettreAJourLigneFacture(
        VisiteAdt $visite,
        int       $procedureId,
        string    $typeService,
        float     $ancienCout,
        float     $nouveauCout,
        string    $description
    ): void {
        if (abs($ancienCout - $nouveauCout) < 0.001) return; // rien à faire

        // Retirer l'ancienne ligne et en créer une nouvelle avec le bon montant
        $this->retirerLigneFacture($visite, $procedureId, $typeService);
        $this->ajouterLigneFacture($visite, $description, $nouveauCout, $typeService, $procedureId);
    }
}
