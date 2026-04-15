<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    /**
     * Liste des rendez-vous avec filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('app_txn_appointments as a')
            ->leftJoin('gen_mst_patient as p', 'a.patient_id', '=', 'p.patient_id')
            ->select(
                'a.*',
                DB::raw("CONCAT(COALESCE(p.first_name,''), ' ', COALESCE(p.last_name,'')) as patient_nom_complet"),
                'p.first_name', 'p.last_name', 'p.mobile_number as patient_telephone', 'p.gender_id'
            );

        if ($request->filled('medecin_id')) {
            $query->where('a.consulting_doctor_id', $request->medecin_id);
        }

        if ($request->filled('patient_id')) {
            $query->where('a.patient_id', $request->patient_id);
        }

        if ($request->filled('date_debut')) {
            $query->whereDate('a.appointment_date', '>=', $request->date_debut);
        }

        if ($request->filled('date_fin')) {
            $query->whereDate('a.appointment_date', '<=', $request->date_fin);
        }

        if ($request->filled('semaine')) {
            // semaine = date ISO du lundi
            $lundi = Carbon::parse($request->semaine)->startOfWeek();
            $dimanche = $lundi->copy()->endOfWeek();
            $query->whereBetween('a.appointment_date', [$lundi, $dimanche]);
        }

        if ($request->filled('statut')) {
            $query->where('a.statut_app', $request->statut);
        }

        $appointments = $query->orderBy('a.appointment_date')->get();

        return response()->json(['success' => true, 'data' => $appointments]);
    }

    /**
     * Créer un rendez-vous
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'consulting_doctor_id' => 'required|string|max:20',
            'appointment_date'     => 'required|date',
            'start_time'           => 'required|date_format:H:i',
            'end_time'             => 'required|date_format:H:i|after:start_time',
            'patient_type'         => 'required|in:habituel,nouveau',
            'appointment_type'     => 'nullable|string|max:20',
            // Patient existant
            'patient_id'           => 'nullable|string|max:20',
            // Nouveau patient
            'nom_patient'          => 'nullable|string|max:100',
            'telephone'            => 'nullable|string|max:50',
            'email'                => 'nullable|string|max:50',
            'date_naissance'       => 'nullable|date',
            'sexe'                 => 'nullable|string|max:50',
            'age_patient'          => 'nullable|string|max:50',
            // Motif
            'remarks'              => 'nullable|string|max:255',
            'raison_motif'         => 'nullable|string|max:50',
            // Tiers
            'personne_pris'        => 'nullable|string|max:50',
            'nom_personne'         => 'nullable|string|max:50',
            'tel_personnepris'     => 'nullable|string|max:50',
            'lien_parente'         => 'nullable|string|max:50',
            'email_patient'        => 'nullable|string|max:50',
            'visit_place'          => 'nullable|string|max:20',
        ]);

        // Générer l'ID appointment
        $lastId = DB::table('app_txn_appointments')->max('id_Rep');
        $newNum = ($lastId ?? 0) + 1;
        $appointmentId = 'APT' . str_pad($newNum, 7, '0', STR_PAD_LEFT);

        $date = Carbon::parse($validated['appointment_date']);
        $startDt = Carbon::parse($validated['appointment_date'] . ' ' . $validated['start_time']);
        $endDt   = Carbon::parse($validated['appointment_date'] . ' ' . $validated['end_time']);

        // Patient ID : si nouveau patient sans ID, on laisse vide ou on prend un temporaire
        $patientId = $validated['patient_id'] ?? ('TMP-' . $appointmentId);

        DB::table('app_txn_appointments')->insert([
            'appointment_id'       => $appointmentId,
            'patient_id'           => $patientId,
            'appointment_date'     => $date,
            'start_time'           => $startDt,
            'end_time'             => $endDt,
            'consulting_doctor_id' => $validated['consulting_doctor_id'],
            'appointment_type'     => $validated['appointment_type'] ?? null,
            'patient_type'         => $validated['patient_type'],
            'remarks'              => $validated['remarks'] ?? null,
            'raison_motif'         => $validated['raison_motif'] ?? null,
            'telephone'            => $validated['telephone'] ?? null,
            'email'                => $validated['email'] ?? null,
            'date_naissance'       => $validated['date_naissance'] ?? null,
            'sexe'                 => $validated['sexe'] ?? null,
            'age_patient'          => $validated['age_patient'] ?? null,
            'personne_pris'        => $validated['personne_pris'] ?? null,
            'nom_personne'         => $validated['nom_personne'] ?? null,
            'tel_personnepris'     => $validated['tel_personnepris'] ?? null,
            'lien_parente'         => $validated['lien_parente'] ?? null,
            'email_patient'        => $validated['email_patient'] ?? null,
            'visit_place'          => $validated['visit_place'] ?? null,
            'statut_app'           => 0,
            'status_id'            => 1,
            'created_user_id'      => 'USR0000001',
            'created_dttm'         => now(),
        ]);

        $appointment = DB::table('app_txn_appointments')
            ->where('appointment_id', $appointmentId)
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous créé avec succès',
            'data'    => $appointment,
        ], 201);
    }

    /**
     * Détail d'un rendez-vous
     */
    public function show(string $id): JsonResponse
    {
        $appointment = DB::table('app_txn_appointments as a')
            ->leftJoin('gen_mst_patient as p', 'a.patient_id', '=', 'p.patient_id')
            ->select(
                'a.*',
                DB::raw("CONCAT(COALESCE(p.first_name,''), ' ', COALESCE(p.last_name,'')) as patient_nom_complet"),
                'p.first_name', 'p.last_name', 'p.mobile_number as patient_telephone', 'p.gender_id'
            )
            ->where('a.appointment_id', $id)
            ->first();

        if (!$appointment) {
            return response()->json(['success' => false, 'message' => 'Rendez-vous introuvable'], 404);
        }

        return response()->json(['success' => true, 'data' => $appointment]);
    }

    /**
     * Mettre à jour un rendez-vous
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $exists = DB::table('app_txn_appointments')->where('appointment_id', $id)->exists();
        if (!$exists) {
            return response()->json(['success' => false, 'message' => 'Rendez-vous introuvable'], 404);
        }

        $validated = $request->validate([
            'appointment_type' => 'nullable|string|max:20',
            'start_time'       => 'nullable|date_format:H:i',
            'end_time'         => 'nullable|date_format:H:i',
            'remarks'          => 'nullable|string|max:255',
            'statut_app'       => 'nullable|integer',
            'motif_annule_report' => 'nullable|string|max:50',
            'obs_annule_report'   => 'nullable|string|max:50',
        ]);

        DB::table('app_txn_appointments')
            ->where('appointment_id', $id)
            ->update($validated);

        return response()->json(['success' => true, 'message' => 'Rendez-vous mis à jour']);
    }

    /**
     * Annuler / supprimer un rendez-vous
     */
    public function destroy(string $id): JsonResponse
    {
        $deleted = DB::table('app_txn_appointments')->where('appointment_id', $id)->delete();

        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Rendez-vous introuvable'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Rendez-vous supprimé']);
    }

    /**
     * Créneaux disponibles pour un médecin à une date donnée.
     * Se base sur la table medecin_horaire (IDMedecin, JourSemaine, HeureDebut, HeureFin, DureeConsultation, Statut).
     */
    public function creneauxDisponibles(Request $request): JsonResponse
    {
        $request->validate([
            'medecin_id' => 'required',
            'date'       => 'required|date',
        ]);

        $medecinId = (int) $request->medecin_id;
        $date      = Carbon::parse($request->date);
        $dayOfWeek = $date->dayOfWeekIso; // 1=lundi … 7=dimanche

        // Récupérer les plages horaires du médecin pour ce jour de la semaine
        $plages = DB::table('medecin_horaire')
            ->where('IDMedecin',   $medecinId)
            ->where('JourSemaine', $dayOfWeek)
            ->where('Statut',      1)
            ->select('HeureDebut', 'HeureFin', 'DureeConsultation')
            ->get();

        if ($plages->isEmpty()) {
            return response()->json([
                'success' => true,
                'data'    => [],
                'message' => 'Aucun horaire configuré pour ce médecin ce jour-là.',
                'date'    => $date->toDateString(),
            ]);
        }

        // RDV déjà pris ce jour (hors annulés)
        $existingRdv = DB::table('app_txn_appointments')
            ->whereDate('appointment_date', $date->toDateString())
            ->where('consulting_doctor_id', $medecinId)
            ->where('statut_app', '!=', 2)
            ->select('start_time', 'end_time')
            ->get();

        $creneauxOccupes = $existingRdv->map(fn($r) => [
            'debut' => Carbon::parse($r->start_time)->format('H:i'),
            'fin'   => Carbon::parse($r->end_time)->format('H:i'),
        ]);

        // Générer les créneaux à partir des plages
        $disponibles = [];
        foreach ($plages as $plage) {
            $debut = substr($plage->HeureDebut, 0, 5);
            $fin   = substr($plage->HeureFin,   0, 5);
            $duree = (int)($plage->DureeConsultation ?? 30);
            if ($duree <= 0) $duree = 30;

            $current = Carbon::createFromFormat('H:i', $debut);
            $endTime = Carbon::createFromFormat('H:i', $fin);

            while ($current->copy()->addMinutes($duree)->lte($endTime)) {
                $slotDebut = $current->format('H:i');
                $slotFin   = $current->copy()->addMinutes($duree)->format('H:i');

                $occupe = $creneauxOccupes->first(fn($o) => $o['debut'] === $slotDebut);

                $disponibles[] = [
                    'debut'  => $slotDebut,
                    'fin'    => $slotFin,
                    'label'  => "{$slotDebut} - {$slotFin}",
                    'occupe' => $occupe !== null,
                    'duree'  => $duree,
                ];
                $current->addMinutes($duree);
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $disponibles,
            'date'    => $date->toDateString(),
            'medecin' => $medecinId,
        ]);
    }
}
