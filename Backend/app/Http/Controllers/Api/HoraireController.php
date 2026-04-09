<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedecinHoraire;
use App\Models\Personnel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HoraireController extends Controller
{
    /**
     * Liste des horaires, filtrables par médecin et/ou jour.
     * GET /api/v1/planning/horaires
     */
    public function index(Request $request): JsonResponse
    {
        $query = MedecinHoraire::with('medecin');

        if ($request->filled('IDMedecin'))   $query->where('IDMedecin', $request->IDMedecin);
        if ($request->filled('JourSemaine')) $query->where('JourSemaine', $request->JourSemaine);
        if ($request->filled('Statut'))      $query->where('Statut', $request->Statut);

        $paginated = $query->orderBy('IDMedecin')->orderBy('JourSemaine')->orderBy('HeureDebut')->paginate($request->get('per_page', 15));
        $items = $paginated->items();

        // Grouper par médecin pour la vue planning (sur la page courante)
        $grouped = [];
        foreach ($items as $h) {
            $grouped[$h->IDMedecin]['medecin'] = $h->medecin;
            $grouped[$h->IDMedecin]['horaires'][] = $h;
        }

        return response()->json([
            'success' => true,
            'data'    => $paginated,
            'grouped' => array_values($grouped),
            'jours'   => MedecinHoraire::JOURS,
        ]);
    }

    /**
     * Créer un horaire (avec vérification de cohérence et chevauchement).
     * POST /api/v1/planning/horaires
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'IDMedecin'         => 'required|integer|exists:hr_mst_user,id',
            'JourSemaine'       => 'required|integer|between:1,7',
            'HeureDebut'        => 'required|date_format:H:i',
            'HeureFin'          => 'required|date_format:H:i|after:HeureDebut',
            'DureeConsultation' => 'required|integer|min:5|max:120',
            'Statut'            => 'nullable|integer|in:0,1',
        ]);

        $this->verifierChevauchement($validated);

        $horaire = MedecinHoraire::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Horaire créé avec succès.',
            'data'    => $horaire->load('medecin'),
        ], 201);
    }

    public function show(MedecinHoraire $horaire): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $horaire->load('medecin')]);
    }

    /**
     * Modifier un horaire avec re-vérification du chevauchement.
     */
    public function update(Request $request, MedecinHoraire $horaire): JsonResponse
    {
        $validated = $request->validate([
            'IDMedecin'         => 'sometimes|integer|exists:hr_mst_user,id',
            'JourSemaine'       => 'sometimes|integer|between:1,7',
            'HeureDebut'        => 'sometimes|date_format:H:i',
            'HeureFin'          => 'sometimes|date_format:H:i',
            'DureeConsultation' => 'sometimes|integer|min:5|max:120',
            'Statut'            => 'nullable|integer|in:0,1',
        ]);

        $this->verifierCoherence(
            $validated['HeureDebut']  ?? $horaire->HeureDebut,
            $validated['HeureFin']    ?? $horaire->HeureFin
        );

        $this->verifierChevauchement(
            array_merge($horaire->toArray(), $validated),
            $horaire->IDmedecin_horaire
        );

        $horaire->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Horaire mis à jour.',
            'data'    => $horaire->fresh()->load('medecin'),
        ]);
    }

    public function destroy(MedecinHoraire $horaire): JsonResponse
    {
        $horaire->delete();
        return response()->json(['success' => true, 'message' => 'Horaire supprimé.']);
    }

    /**
     * Retourner le planning complet d'un médecin (7 jours).
     * GET /api/v1/planning/horaires/medecin/{id}
     */
    public function planningMedecin(int $id): JsonResponse
    {
        $medecin = Personnel::findOrFail($id);
        $horaires = MedecinHoraire::where('IDMedecin', $id)
            ->where('Statut', 1)
            ->orderBy('JourSemaine')
            ->orderBy('HeureDebut')
            ->get()
            ->groupBy('JourSemaine');

        $planning = [];
        foreach (MedecinHoraire::JOURS as $num => $libelle) {
            $planning[] = [
                'jour'    => $num,
                'libelle' => $libelle,
                'plages'  => $horaires->get($num, collect())->values(),
                'actif'   => $horaires->has($num),
            ];
        }

        return response()->json([
            'success'  => true,
            'medecin'  => $medecin,
            'planning' => $planning,
        ]);
    }

    // ── Helpers privés ───────────────────────────────────────

    private function verifierChevauchement(array $data, ?int $excludeId = null): void
    {
        $query = MedecinHoraire::where('IDMedecin', $data['IDMedecin'])
            ->where('JourSemaine', $data['JourSemaine'])
            ->where('Statut', 1)
            ->where(function ($q) use ($data) {
                // chevauchement : plages qui se croisent
                $q->where('HeureDebut', '<', $data['HeureFin'])
                  ->where('HeureFin',   '>',  $data['HeureDebut']);
            });

        if ($excludeId) {
            $query->where('IDmedecin_horaire', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'HeureDebut' => 'Cette plage horaire chevauche un horaire existant pour ce médecin ce jour-là.',
            ]);
        }
    }

    private function verifierCoherence(string $debut, string $fin): void
    {
        if ($fin <= $debut) {
            throw ValidationException::withMessages([
                'HeureFin' => "L'heure de fin doit être supérieure à l'heure de début.",
            ]);
        }
    }
}
