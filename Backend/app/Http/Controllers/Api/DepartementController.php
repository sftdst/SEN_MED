<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Departement::with('hospital', 'typeServices');

        if ($request->has('Hospital_id')) {
            $query->where('Hospital_id', $request->Hospital_id);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('NomDepartement', 'ilike', "%{$s}%")
                  ->orWhere('description', 'ilike', "%{$s}%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($request->get('per_page', 15)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'NomDepartement' => 'required|string|max:50',
            'description'    => 'required|string|max:200',
            'status'         => 'nullable|integer',
            'Hospital_id'    => 'required|numeric|exists:gen_mst_hospital,Hospital_id',
        ]);

        $departement = Departement::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Département créé avec succès.',
            'data'    => $departement->load('hospital'),
        ], 201);
    }

    public function show(Departement $departement): JsonResponse
    {
        $departement->load('hospital', 'typeServices.services');

        return response()->json([
            'success' => true,
            'data'    => $departement,
        ]);
    }

    public function update(Request $request, Departement $departement): JsonResponse
    {
        $validated = $request->validate([
            'NomDepartement' => 'sometimes|required|string|max:50',
            'description'    => 'sometimes|required|string|max:200',
            'status'         => 'nullable|integer',
            'Hospital_id'    => 'nullable|numeric|exists:gen_mst_hospital,Hospital_id',
        ]);

        $departement->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Département mis à jour avec succès.',
            'data'    => $departement->load('hospital'),
        ]);
    }

    public function destroy(Departement $departement): JsonResponse
    {
        $departement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Département supprimé avec succès.',
        ]);
    }
}
