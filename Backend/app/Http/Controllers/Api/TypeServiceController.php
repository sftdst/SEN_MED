<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TypeServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TypeService::with('departement', 'services');

        if ($request->has('IDgen_mst_Departement')) {
            $query->where('IDgen_mst_Departement', $request->IDgen_mst_Departement);
        }

        if ($request->filled('search')) {
            $query->where('NomType', 'like', "%{$request->search}%");
        }

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($request->get('per_page', 15)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'NomType'              => 'required|string|max:50',
            'description'          => 'required|string|max:200',
            'status'               => 'nullable|integer',
            'IDgen_mst_Departement' => 'required|integer|exists:gen_mst_Departement,IDgen_mst_Departement',
        ]);

        $typeService = TypeService::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Type de service créé avec succès.',
            'data'    => $typeService->load('departement'),
        ], 201);
    }

    public function show(TypeService $typeService): JsonResponse
    {
        $typeService->load('departement.hospital', 'services');

        return response()->json([
            'success' => true,
            'data'    => $typeService,
        ]);
    }

    public function update(Request $request, TypeService $typeService): JsonResponse
    {
        $validated = $request->validate([
            'NomType'              => 'sometimes|required|string|max:50',
            'description'          => 'sometimes|required|string|max:200',
            'status'               => 'nullable|integer',
            'IDgen_mst_Departement' => 'nullable|integer|exists:gen_mst_Departement,IDgen_mst_Departement',
        ]);

        $typeService->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Type de service mis à jour avec succès.',
            'data'    => $typeService->load('departement'),
        ]);
    }

    public function destroy(TypeService $typeService): JsonResponse
    {
        $typeService->delete();

        return response()->json([
            'success' => true,
            'message' => 'Type de service supprimé avec succès.',
        ]);
    }
}
