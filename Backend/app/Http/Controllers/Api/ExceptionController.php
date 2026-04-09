<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedecinException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ExceptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MedecinException::with('medecin');

        if ($request->filled('IDMedecin')) $query->where('IDMedecin', $request->IDMedecin);
        if ($request->filled('Type'))      $query->where('Type', $request->Type);

        // Filtre période
        if ($request->filled('DateDebut')) {
            $query->where('DateFin', '>=', $request->DateDebut);
        }
        if ($request->filled('DateFin')) {
            $query->where('DateDebut', '<=', $request->DateFin);
        }

        $exceptions = $query->orderBy('DateDebut', 'desc')->get();

        return response()->json([
            'success' => true,
            'data'    => $exceptions,
            'types'   => MedecinException::TYPES,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'IDMedecin'   => 'required|integer|exists:hr_mst_user,id',
            'DateDebut'   => 'required|date',
            'DateFin'     => 'required|date|after_or_equal:DateDebut',
            'Type'        => 'nullable|in:conge,maladie,mission,formation,autre',
            'Description' => 'nullable|string|max:1000',
        ]);

        $this->verifierChevauchementException($validated);

        $exception = MedecinException::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Absence/indisponibilité enregistrée.',
            'data'    => $exception->load('medecin'),
        ], 201);
    }

    public function show(MedecinException $exception): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $exception->load('medecin')]);
    }

    public function update(Request $request, MedecinException $exception): JsonResponse
    {
        $validated = $request->validate([
            'IDMedecin'   => 'sometimes|integer|exists:hr_mst_user,id',
            'DateDebut'   => 'sometimes|date',
            'DateFin'     => 'sometimes|date',
            'Type'        => 'nullable|in:conge,maladie,mission,formation,autre',
            'Description' => 'nullable|string|max:1000',
        ]);

        $debut = $validated['DateDebut'] ?? $exception->DateDebut;
        $fin   = $validated['DateFin']   ?? $exception->DateFin;

        if ($fin < $debut) {
            throw ValidationException::withMessages([
                'DateFin' => 'La date de fin doit être >= à la date de début.',
            ]);
        }

        $this->verifierChevauchementException(
            array_merge($exception->toArray(), $validated),
            $exception->IDmedecin_exception
        );

        $exception->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Absence mise à jour.',
            'data'    => $exception->fresh()->load('medecin'),
        ]);
    }

    public function destroy(MedecinException $exception): JsonResponse
    {
        $exception->delete();
        return response()->json(['success' => true, 'message' => 'Absence supprimée.']);
    }

    private function verifierChevauchementException(array $data, ?int $excludeId = null): void
    {
        $query = MedecinException::where('IDMedecin', $data['IDMedecin'])
            ->where('DateDebut', '<=', $data['DateFin'])
            ->where('DateFin',   '>=', $data['DateDebut']);

        if ($excludeId) {
            $query->where('IDmedecin_exception', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'DateDebut' => 'Cette période chevauche une absence déjà enregistrée pour ce médecin.',
            ]);
        }
    }
}
