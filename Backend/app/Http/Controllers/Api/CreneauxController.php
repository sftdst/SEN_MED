<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedecinHoraire;
use App\Models\MedecinException;
use App\Models\JourFerie;
use App\Models\MedecinFerieDisponibilite;
use App\Models\Personnel;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreneauxController extends Controller
{
    /**
     * Générer les créneaux disponibles pour un médecin à une date donnée.
     *
     * GET /api/v1/planning/creneaux?IDMedecin=X&date=2026-04-10
     *
     * Priorité :
     *   🔴 Jour férié + disponibilité spéciale
     *   🟠 Exception (absence)
     *   🟢 Planning normal
     */
    public function creneauxDuJour(Request $request): JsonResponse
    {
        $request->validate([
            'IDMedecin' => 'required|integer|exists:hr_mst_user,id',
            'date'      => 'required|date',
        ]);

        $idMedecin = $request->IDMedecin;
        $date      = Carbon::parse($request->date)->startOfDay();
        $medecin   = Personnel::findOrFail($idMedecin);

        // ── Priorité 🔴 : Jour férié avec disponibilité spéciale ────────
        $jourFerie = JourFerie::where('DateFerie', $date->toDateString())
            ->where('Statut', 1)
            ->first();

        if ($jourFerie) {
            $dispos = MedecinFerieDisponibilite::where('IDMedecin', $idMedecin)
                ->where('DateFerie', $date->toDateString())
                ->where('Statut', 1)
                ->orderBy('HeureDebut')
                ->get();

            if ($dispos->isEmpty()) {
                return response()->json([
                    'success'   => true,
                    'date'      => $date->toDateString(),
                    'medecin'   => $medecin,
                    'type'      => 'jour_ferie_indisponible',
                    'message'   => "Jour férié : {$jourFerie->Libelle}. Le médecin n'a pas de disponibilité enregistrée.",
                    'creneaux'  => [],
                ]);
            }

            $creneaux = [];
            foreach ($dispos as $d) {
                $creneaux = array_merge($creneaux, $this->genererCreneaux($date, $d->HeureDebut, $d->HeureFin, $d->DureeConsultation));
            }

            return response()->json([
                'success'    => true,
                'date'       => $date->toDateString(),
                'medecin'    => $medecin,
                'type'       => 'jour_ferie_disponible',
                'jour_ferie' => $jourFerie->Libelle,
                'creneaux'   => $creneaux,
                'nb_total'   => count($creneaux),
            ]);
        }

        // ── Priorité 🟠 : Exception (absence) ───────────────────────────
        $exception = MedecinException::where('IDMedecin', $idMedecin)
            ->where('DateDebut', '<=', $date->copy()->endOfDay())
            ->where('DateFin',   '>=', $date->copy()->startOfDay())
            ->first();

        if ($exception) {
            return response()->json([
                'success'   => true,
                'date'      => $date->toDateString(),
                'medecin'   => $medecin,
                'type'      => 'exception',
                'message'   => "Médecin absent : {$exception->libelle_type}" . ($exception->Description ? " — {$exception->Description}" : ''),
                'creneaux'  => [],
            ]);
        }

        // ── Priorité 🟢 : Planning normal ───────────────────────────────
        $jourSemaine = $date->isoWeekday(); // 1=Lundi ... 7=Dimanche

        $plages = MedecinHoraire::where('IDMedecin', $idMedecin)
            ->where('JourSemaine', $jourSemaine)
            ->where('Statut', 1)
            ->orderBy('HeureDebut')
            ->get();

        if ($plages->isEmpty()) {
            return response()->json([
                'success'  => true,
                'date'     => $date->toDateString(),
                'medecin'  => $medecin,
                'type'     => 'repos',
                'message'  => 'Aucun horaire défini pour ce jour.',
                'creneaux' => [],
            ]);
        }

        $creneaux = [];
        foreach ($plages as $p) {
            $creneaux = array_merge($creneaux, $this->genererCreneaux($date, $p->HeureDebut, $p->HeureFin, $p->DureeConsultation));
        }

        return response()->json([
            'success'  => true,
            'date'     => $date->toDateString(),
            'medecin'  => $medecin,
            'type'     => 'normal',
            'creneaux' => $creneaux,
            'nb_total' => count($creneaux),
        ]);
    }

    /**
     * Créneaux disponibles sur une semaine entière pour un médecin.
     * GET /api/v1/planning/creneaux/semaine?IDMedecin=X&date_debut=2026-04-07
     */
    public function creneauxSemaine(Request $request): JsonResponse
    {
        $request->validate([
            'IDMedecin'   => 'required|integer|exists:hr_mst_user,id',
            'date_debut'  => 'required|date',
        ]);

        $debut   = Carbon::parse($request->date_debut)->startOfWeek();
        $semaine = [];

        for ($i = 0; $i < 7; $i++) {
            $date    = $debut->copy()->addDays($i);
            $fakeReq = Request::create('/creneaux', 'GET', [
                'IDMedecin' => $request->IDMedecin,
                'date'      => $date->toDateString(),
            ]);
            $reponse    = $this->creneauxDuJour($fakeReq);
            $data       = json_decode($reponse->getContent(), true);
            $semaine[]  = $data;
        }

        return response()->json(['success' => true, 'semaine' => $semaine]);
    }

    /**
     * Vue synthèse d'un médecin (horaires + exceptions en cours + jours fériés à venir).
     * GET /api/v1/planning/synthese/{idMedecin}
     */
    public function synthese(int $idMedecin): JsonResponse
    {
        $medecin   = Personnel::findOrFail($idMedecin);
        $aujourd   = Carbon::today();

        $horaires  = MedecinHoraire::where('IDMedecin', $idMedecin)->where('Statut', 1)
            ->orderBy('JourSemaine')->orderBy('HeureDebut')->get();

        $exceptions = MedecinException::where('IDMedecin', $idMedecin)
            ->where('DateFin', '>=', $aujourd)
            ->orderBy('DateDebut')->get();

        $feriesAVenir = JourFerie::where('DateFerie', '>=', $aujourd)
            ->where('DateFerie', '<=', $aujourd->copy()->addMonths(3))
            ->where('Statut', 1)
            ->orderBy('DateFerie')
            ->with(['disponibilites' => fn($q) => $q->where('IDMedecin', $idMedecin)])
            ->get();

        // Planning par jour
        $planning = [];
        foreach (MedecinHoraire::JOURS as $num => $libelle) {
            $plagesJour = $horaires->where('JourSemaine', $num)->values();
            $planning[] = [
                'jour'       => $num,
                'libelle'    => $libelle,
                'plages'     => $plagesJour,
                'nb_creneaux' => $plagesJour->sum('nb_creneaux'),
                'actif'      => $plagesJour->isNotEmpty(),
            ];
        }

        return response()->json([
            'success'      => true,
            'medecin'      => $medecin,
            'planning'     => $planning,
            'exceptions'   => $exceptions,
            'jours_feries' => $feriesAVenir,
            'stats'        => [
                'jours_travail'    => $horaires->pluck('JourSemaine')->unique()->count(),
                'plages_horaires'  => $horaires->count(),
                'absences_actuelles' => $exceptions->count(),
            ],
        ]);
    }

    // ── Helper : génère la liste des créneaux ────────────────────────────
    private function genererCreneaux(Carbon $date, string $debut, string $fin, int $duree): array
    {
        $creneaux = [];
        [$hd, $md] = array_map('intval', explode(':', substr($debut, 0, 5)));
        [$hf, $mf] = array_map('intval', explode(':', substr($fin,   0, 5)));

        $start = $date->copy()->setTime($hd, $md);
        $end   = $date->copy()->setTime($hf, $mf);

        while ($start->copy()->addMinutes($duree)->lte($end)) {
            $creneaux[] = [
                'debut'       => $start->format('H:i'),
                'fin'         => $start->copy()->addMinutes($duree)->format('H:i'),
                'debut_ts'    => $start->toIso8601String(),
                'fin_ts'      => $start->copy()->addMinutes($duree)->toIso8601String(),
                'disponible'  => true,
            ];
            $start->addMinutes($duree);
        }

        return $creneaux;
    }
}
