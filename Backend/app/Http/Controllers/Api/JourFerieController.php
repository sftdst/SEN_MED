<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JourFerie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JourFerieController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = JourFerie::with('disponibilites.medecin');

        if ($request->filled('annee')) {
            $query->whereYear('DateFerie', $request->annee);
        }
        if ($request->filled('Statut')) {
            $query->where('Statut', $request->Statut);
        }

        $jours = $query->orderBy('DateFerie')->paginate($request->get('per_page', 15));

        return response()->json(['success' => true, 'data' => $jours]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'DateFerie' => 'required|date|unique:jours_feries,DateFerie',
            'Libelle'   => 'required|string|max:100',
            'Statut'    => 'nullable|integer|in:0,1',
        ]);

        $jour = JourFerie::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jour férié ajouté.',
            'data'    => $jour,
        ], 201);
    }

    public function show(JourFerie $jourFerie): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $jourFerie->load('disponibilites.medecin'),
        ]);
    }

    public function update(Request $request, JourFerie $jourFerie): JsonResponse
    {
        $validated = $request->validate([
            'DateFerie' => 'sometimes|date|unique:jours_feries,DateFerie,' . $jourFerie->IDjour_ferie . ',IDjour_ferie',
            'Libelle'   => 'sometimes|string|max:100',
            'Statut'    => 'nullable|integer|in:0,1',
        ]);

        $jourFerie->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jour férié mis à jour.',
            'data'    => $jourFerie->fresh(),
        ]);
    }

    public function destroy(JourFerie $jourFerie): JsonResponse
    {
        $jourFerie->delete();
        return response()->json(['success' => true, 'message' => 'Jour férié supprimé.']);
    }

    /**
     * Initialiser les jours fériés du Sénégal pour une année.
     * POST /api/v1/planning/jours-feries/initialiser
     */
    public function initialiserSenegal(Request $request): JsonResponse
    {
        $annee   = $request->input('annee', now()->year);
        $created = 0;

        $joursFixes = [
            ['date' => "{$annee}-01-01", 'libelle' => 'Nouvel An'],
            ['date' => "{$annee}-04-04", 'libelle' => 'Fête de l\'indépendance du Sénégal'],
            ['date' => "{$annee}-05-01", 'libelle' => 'Fête du Travail'],
            ['date' => "{$annee}-08-15", 'libelle' => 'Assomption'],
            ['date' => "{$annee}-11-01", 'libelle' => 'Toussaint'],
            ['date' => "{$annee}-12-25", 'libelle' => 'Noël'],
        ];

        foreach ($joursFixes as $j) {
            JourFerie::firstOrCreate(
                ['DateFerie' => $j['date']],
                ['Libelle' => $j['libelle'], 'Statut' => 1]
            ) ? $created++ : null;
        }

        return response()->json([
            'success' => true,
            'message' => "{$created} jours fériés ajoutés pour {$annee}.",
        ]);
    }
}
