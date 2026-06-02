<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\MailingConfig;
use App\Models\Personnel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
            'statut_app'           => in_array($validated['visit_place'] ?? '', ['cabinet', 'hopital']) ? 1 : 0,
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
     * Liste des demandes issues du site web
     */
    public function demandesListe(Request $request): JsonResponse
    {
        $query = DB::table('app_txn_appointments')
            ->where('created_user_id', 'WEB')
            ->orderBy('created_dttm', 'desc');

        if ($request->filled('statut')) {
            $query->where('statut_app', $request->statut);
        }
        if ($request->filled('date_debut')) {
            $query->whereDate('appointment_date', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('appointment_date', '<=', $request->date_fin);
        }
        if ($request->filled('recherche')) {
            $q = '%' . $request->recherche . '%';
            $query->where(function ($sub) use ($q) {
                $sub->where('nom_personne', 'like', $q)
                    ->orWhere('telephone',   'like', $q)
                    ->orWhere('email',       'like', $q)
                    ->orWhere('appointment_id', 'like', $q);
            });
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    /**
     * Accepter une demande — assigne médecin/créneau/type et envoie l'email de confirmation
     */
    public function accepter(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'consulting_doctor_id' => 'required|string|max:20',
            'appointment_date'     => 'nullable|date',
            'start_time'           => 'required|date_format:H:i',
            'end_time'             => 'required|date_format:H:i',
            'appointment_type'     => 'nullable|string|max:20',
        ]);

        $demande = DB::table('app_txn_appointments')
            ->where('appointment_id', $id)
            ->where('created_user_id', 'WEB')
            ->first();

        if (!$demande) {
            return response()->json(['success' => false, 'message' => 'Demande introuvable'], 404);
        }

        $dateStr = Carbon::parse($data['appointment_date'] ?? $demande->appointment_date)->toDateString();

        DB::table('app_txn_appointments')
            ->where('appointment_id', $id)
            ->update([
                'consulting_doctor_id' => $data['consulting_doctor_id'],
                'appointment_date'     => $dateStr,
                'start_time'           => $dateStr . ' ' . $data['start_time'] . ':00',
                'end_time'             => $dateStr . ' ' . $data['end_time'] . ':00',
                'appointment_type'     => $data['appointment_type'] ?? 'consultation',
                'statut_app'           => 1,
            ]);

        // Nom du médecin pour l'email
        $medecin = Personnel::find((int) $data['consulting_doctor_id']);
        $doctorName = $medecin
            ? 'Dr. ' . ($medecin->staff_name ?? trim(($medecin->first_name ?? '') . ' ' . ($medecin->last_name ?? '')))
            : null;

        // Email de confirmation
        if ($demande->email) {
            try {
                $dateFormatted = Carbon::parse($dateStr)->locale('fr')->isoFormat('dddd D MMMM YYYY');
                $html = $this->buildConfirmationHtml(
                    $demande->nom_personne ?? 'Patient',
                    $dateFormatted,
                    $data['start_time'],
                    $data['end_time'],
                    $doctorName,
                    $data['appointment_type'] ?? 'consultation',
                    $id
                );
                $this->sendMail($demande->email, $demande->nom_personne ?? 'Patient', 'Confirmation de votre rendez-vous', $html);
            } catch (\Exception $e) {
                Log::warning('Mail confirmation RDV non envoyé: ' . $e->getMessage());
            }
        }

        return response()->json(['success' => true, 'message' => 'Demande acceptée — email de confirmation envoyé']);
    }

    /**
     * Rejeter une demande — envoie l'email de rejet avec motif
     */
    public function rejeter(Request $request, string $id): JsonResponse
    {
        $demande = DB::table('app_txn_appointments')
            ->where('appointment_id', $id)
            ->where('created_user_id', 'WEB')
            ->first();

        if (!$demande) {
            return response()->json(['success' => false, 'message' => 'Demande introuvable'], 404);
        }

        $motif = trim($request->input('motif', ''));

        DB::table('app_txn_appointments')
            ->where('appointment_id', $id)
            ->update([
                'statut_app'          => 2,
                'motif_annule_report' => $motif ?: null,
            ]);

        // Email de rejet
        if ($demande->email) {
            try {
                $html = $this->buildRejetHtml(
                    $demande->nom_personne ?? 'Patient',
                    Carbon::parse($demande->appointment_date)->locale('fr')->isoFormat('dddd D MMMM YYYY'),
                    $motif,
                    $id
                );
                $this->sendMail($demande->email, $demande->nom_personne ?? 'Patient', 'Votre demande de rendez-vous', $html);
            } catch (\Exception $e) {
                Log::warning('Mail rejet RDV non envoyé: ' . $e->getMessage());
            }
        }

        return response()->json(['success' => true, 'message' => 'Demande rejetée — email envoyé']);
    }

    // ── Helpers mail ──────────────────────────────────────────────────────────

    private function sendMail(string $to, string $toName, string $subject, string $html): void
    {
        $cfg = MailingConfig::first();
        if (!$cfg) {
            throw new \RuntimeException('Configuration mail non trouvée');
        }

        Config::set('mail.mailers.smtp', [
            'transport'  => 'smtp',
            'host'       => $cfg->host,
            'port'       => (int) $cfg->port,
            'encryption' => $cfg->encryption === 'none' ? null : $cfg->encryption,
            'username'   => $cfg->username,
            'password'   => $cfg->password,
        ]);
        Config::set('mail.from.address', $cfg->from_email);
        Config::set('mail.from.name',    $cfg->from_name);

        Mail::html($html, function ($msg) use ($to, $toName, $subject, $cfg) {
            $msg->to($to, $toName)
                ->from($cfg->from_email, $cfg->from_name)
                ->subject($subject);
        });
    }

    private function buildConfirmationHtml(string $nom, string $date, string $debut, string $fin, ?string $medecin, string $type, string $ref): string
    {
        $typeLabel = match($type) {
            'bilan'       => 'Bilan médical',
            'suivi'       => 'Suivi médical',
            'urgence'     => 'Urgence',
            'visite'      => 'Visite à domicile',
            'autre'       => 'Autre',
            default       => 'Consultation',
        };
        $medecinLine = $medecin ? "<p><strong>👨‍⚕️ Médecin :</strong> {$medecin}</p>" : '';

        return <<<HTML
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif">
<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.10)">
  <div style="background:#003268;padding:28px 32px">
    <h1 style="margin:0;color:#fff;font-size:20px">✅ Rendez-vous confirmé</h1>
  </div>
  <div style="padding:28px 32px">
    <p style="font-size:15px;color:#333">Bonjour <strong>{$nom}</strong>,</p>
    <p style="font-size:14px;color:#555">Votre demande de rendez-vous a été <strong style="color:#2e7d32">acceptée</strong>. Voici les détails :</p>
    <div style="background:#f0f7f0;border:1px solid #c8e6c9;border-radius:8px;padding:18px 20px;margin:20px 0">
      <p style="margin:6px 0"><strong>📅 Date :</strong> {$date}</p>
      <p style="margin:6px 0"><strong>🕐 Horaire :</strong> {$debut} – {$fin}</p>
      {$medecinLine}
      <p style="margin:6px 0"><strong>🏥 Type :</strong> {$typeLabel}</p>
      <p style="margin:6px 0"><strong>📋 Référence :</strong> <code>{$ref}</code></p>
    </div>
    <p style="font-size:14px;color:#555">Merci de vous présenter quelques minutes avant l'heure prévue. En cas d'empêchement, merci de nous prévenir.</p>
  </div>
  <div style="background:#f8f9fa;padding:16px 32px;font-size:12px;color:#999;text-align:center">
    Ce message a été envoyé automatiquement — merci de ne pas y répondre directement.
  </div>
</div>
</body></html>
HTML;
    }

    private function buildRejetHtml(string $nom, string $date, string $motif, string $ref): string
    {
        $motifLine = $motif ? "<p style='margin:6px 0'><strong>Motif :</strong> {$motif}</p>" : '';

        return <<<HTML
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif">
<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.10)">
  <div style="background:#003268;padding:28px 32px">
    <h1 style="margin:0;color:#fff;font-size:20px">📋 Demande de rendez-vous</h1>
  </div>
  <div style="padding:28px 32px">
    <p style="font-size:15px;color:#333">Bonjour <strong>{$nom}</strong>,</p>
    <p style="font-size:14px;color:#555">Nous avons bien reçu votre demande de rendez-vous du <strong>{$date}</strong>, mais nous ne sommes malheureusement pas en mesure de la confirmer.</p>
    <div style="background:#fdecea;border:1px solid #f5c6cb;border-radius:8px;padding:18px 20px;margin:20px 0">
      <p style="margin:6px 0"><strong>📋 Référence :</strong> <code>{$ref}</code></p>
      {$motifLine}
    </div>
    <p style="font-size:14px;color:#555">N'hésitez pas à nous recontacter pour fixer une nouvelle date ou à utiliser notre formulaire de demande de rendez-vous.</p>
  </div>
  <div style="background:#f8f9fa;padding:16px 32px;font-size:12px;color:#999;text-align:center">
    Ce message a été envoyé automatiquement — merci de ne pas y répondre directement.
  </div>
</div>
</body></html>
HTML;
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
