<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedecinFerieDisponibilite;
use App\Models\JourFerie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FerieDisponibiliteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MedecinFerieDisponibilite::with('medecin', 'jourFerie');

        if ($request->filled('IDMedecin')) $query->where('IDMedecin', $request->IDMedecin);
        if ($request->filled('DateFerie')) $query->where('DateFerie', $request->DateFerie);
        if ($request->filled('Statut'))    $query->where('Statut', $request->Statut);

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('DateFerie')->orderBy('HeureDebut')->paginate($request->get('per_page', 15)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'IDMedecin'         => 'required|integer|exists:hr_mst_user,id',
            'DateFerie'         => 'required|date|exists:jours_feries,DateFerie',
            'HeureDebut'        => 'required|date_format:H:i',
            'HeureFin'          => 'required|date_format:H:i|after:HeureDebut',
            'DureeConsultation' => 'required|integer|min:5|max:120',
            'Statut'            => 'nullable|integer|in:0,1',
        ]);

        $this->verifierChevauchementFerie($validated);

        $dispo = MedecinFerieDisponibilite::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Disponibilité sur jour férié enregistrée.',
            'data'    => $dispo->load('medecin', 'jourFerie'),
        ], 201);
    }

    public function show(MedecinFerieDisponibilite $ferieDisponibilite): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $ferieDisponibilite->load('medecin', 'jourFerie'),
        ]);
    }

    public function update(Request $request, MedecinFerieDisponibilite $ferieDisponibilite): JsonResponse
    {
        $validated = $request->validate([
            'IDMedecin'         => 'sometimes|integer|exists:hr_mst_user,id',
            'DateFerie'         => 'sometimes|date|exists:jours_feries,DateFerie',
            'HeureDebut'        => 'sometimes|date_format:H:i',
            'HeureFin'          => 'sometimes|date_format:H:i',
            'DureeConsultation' => 'sometimes|integer|min:5|max:120',
            'Statut'            => 'nullable|integer|in:0,1',
        ]);

        $debut = $validated['HeureDebut'] ?? $ferieDisponibilite->HeureDebut;
        $fin   = $validated['HeureFin']   ?? $ferieDisponibilite->HeureFin;

        if ($fin <= $debut) {
            throw ValidationException::withMessages([
                'HeureFin' => "L'heure de fin doit être supérieure à l'heure de début.",
            ]);
        }

        $this->verifierChevauchementFerie(
            array_merge($ferieDisponibilite->toArray(), $validated),
            $ferieDisponibilite->IDmedecin_ferie
        );

        $ferieDisponibilite->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Disponibilité mise à jour.',
            'data'    => $ferieDisponibilite->fresh()->load('medecin', 'jourFerie'),
        ]);
    }

    public function destroy(MedecinFerieDisponibilite $ferieDisponibilite): JsonResponse
    {
        $ferieDisponibilite->delete();
        return response()->json(['success' => true, 'message' => 'Disponibilité supprimée.']);
    }

    private function verifierChevauchementFerie(array $data, ?int $excludeId = null): void
    {
        $query = MedecinFerieDisponibilite::where('IDMedecin', $data['IDMedecin'])
            ->where('DateFerie', $data['DateFerie'])
            ->where('HeureDebut', '<', $data['HeureFin'])
            ->where('HeureFin',   '>',  $data['HeureDebut']);

        if ($excludeId) {
            $query->where('IDmedecin_ferie', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'HeureDebut' => 'Cette plage chevauche une disponibilité existante pour ce médecin ce jour férié.',
            ]);
        }
    }
}
