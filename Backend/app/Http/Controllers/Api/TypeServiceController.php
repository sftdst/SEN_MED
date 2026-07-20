<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeService;
use App\Models\Departement;
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

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'rows'   => 'required|array|min:1',
            'rows.*' => 'array',
        ]);

        // Charger les IDs de départements valides
        $deptIds = Departement::pluck('IDgen_mst_Departement')->map(fn($v) => (int)$v)->toArray();

        $created = 0;
        $errors  = [];

        foreach ($request->input('rows') as $index => $row) {
            $ligne   = $index + 2; // numéro de ligne fichier (1 = header)
            $nomType = trim($row['NomType'] ?? $row['nomtype'] ?? '');
            $desc    = trim($row['description'] ?? $row['Description'] ?? '');
            $deptId  = (int)($row['IDgen_mst_Departement'] ?? $row['idgen_mst_departement'] ?? 0);
            $status  = isset($row['status']) ? (int)$row['status'] : 1;

            if (empty($nomType)) {
                $errors[] = "Ligne {$ligne} : NomType vide.";
                continue;
            }
            if (!in_array($deptId, $deptIds, true)) {
                $errors[] = "Ligne {$ligne} : département ID {$deptId} introuvable.";
                continue;
            }

            TypeService::create([
                'NomType'               => $nomType,
                'description'           => $desc,
                'IDgen_mst_Departement' => $deptId,
                'status'                => $status,
            ]);
            $created++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$created} type(s) de service importé(s).",
            'created' => $created,
            'errors'  => $errors,
        ]);
    }
}
