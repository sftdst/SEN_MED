<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\TypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('typeService.departement');

        if ($request->has('IDgen_mst_Type_Service')) {
            $query->where('IDgen_mst_Type_Service', $request->IDgen_mst_Type_Service);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('short_name', 'like', "%{$s}%")
                  ->orWhere('id_gen_mst_service', 'like', "%{$s}%")
                  ->orWhere('code_local', 'like', "%{$s}%");
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
            'id_gen_mst_service'     => 'nullable|string|max:50|unique:gen_mst_service,id_gen_mst_service',
            'n_ordre'                => 'nullable|string|max:50',
            'short_name'             => 'nullable|string|max:50',
            'tri_name'               => 'nullable|string|max:50',
            'code_local'             => 'nullable|string|max:50',
            'cle_tarif_service'      => 'nullable|string|max:50',
            'groupe_id'              => 'nullable|string|max:50',
            'categorie_id'           => 'nullable|string|max:50',
            'type_categorie'         => 'nullable|string|max:50',
            'status'                 => 'nullable|integer',
            'valeur_cts'             => 'nullable|string|max:50',
            'majoration_ferie'       => 'nullable|string|max:50',
            'code_snomed'            => 'nullable|string|max:50',
            'code_hl7'               => 'nullable|string|max:50',
            'IDgen_mst_Type_Service' => 'required|integer|exists:gen_mst_Type_Service,IDgen_mst_Type_Service',
        ]);

        $service = Service::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service créé avec succès.',
            'data'    => $service->load('typeService'),
        ], 201);
    }

    public function show(Service $service): JsonResponse
    {
        $service->load('typeService.departement.hospital');

        return response()->json([
            'success' => true,
            'data'    => $service,
        ]);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $validated = $request->validate([
            'id_gen_mst_service'     => 'nullable|string|max:50|unique:gen_mst_service,id_gen_mst_service,' . $service->id_service . ',id_service',
            'n_ordre'                => 'nullable|string|max:50',
            'short_name'             => 'nullable|string|max:50',
            'tri_name'               => 'nullable|string|max:50',
            'code_local'             => 'nullable|string|max:50',
            'cle_tarif_service'      => 'nullable|string|max:50',
            'groupe_id'              => 'nullable|string|max:50',
            'categorie_id'           => 'nullable|string|max:50',
            'type_categorie'         => 'nullable|string|max:50',
            'status'                 => 'nullable|integer',
            'valeur_cts'             => 'nullable|string|max:50',
            'majoration_ferie'       => 'nullable|string|max:50',
            'code_snomed'            => 'nullable|string|max:50',
            'code_hl7'               => 'nullable|string|max:50',
            'IDgen_mst_Type_Service' => 'nullable|integer|exists:gen_mst_Type_Service,IDgen_mst_Type_Service',
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service mis à jour avec succès.',
            'data'    => $service->load('typeService'),
        ]);
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service supprimé avec succès.',
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'rows'   => 'required|array|min:1',
            'rows.*' => 'array',
        ]);

        // IDs de types de service valides
        $typeIds = TypeService::pluck('IDgen_mst_Type_Service')->map(fn($v) => (int)$v)->toArray();

        $created = 0;
        $errors  = [];

        foreach ($request->input('rows') as $index => $row) {
            $ligne   = $index + 2;
            $libelle = trim($row['tri_name'] ?? $row['NomService'] ?? $row['Libellé'] ?? $row['libelle'] ?? '');
            $typeId  = (int)($row['IDgen_mst_Type_Service'] ?? $row['type_service_id'] ?? 0);
            $code    = trim($row['id_gen_mst_service'] ?? $row['code'] ?? '');
            $valeur  = trim($row['valeur_cts'] ?? $row['prix'] ?? '');
            $status  = isset($row['status']) ? (int)$row['status'] : 1;

            if (empty($libelle)) {
                $errors[] = "Ligne {$ligne} : libellé (tri_name) vide.";
                continue;
            }
            if (!in_array($typeId, $typeIds, true)) {
                $errors[] = "Ligne {$ligne} : type de service ID {$typeId} introuvable.";
                continue;
            }
            // Vérifier l'unicité du code si fourni
            if ($code && Service::where('id_gen_mst_service', $code)->exists()) {
                $errors[] = "Ligne {$ligne} : code \"{$code}\" déjà utilisé — ligne ignorée.";
                continue;
            }

            Service::create([
                'tri_name'               => $libelle,
                'short_name'             => trim($row['short_name'] ?? ''),
                'id_gen_mst_service'     => $code ?: null,
                'valeur_cts'             => $valeur ?: null,
                'code_local'             => trim($row['code_local'] ?? '') ?: null,
                'type_categorie'         => trim($row['type_categorie'] ?? '') ?: null,
                'cle_tarif_service'      => trim($row['cle_tarif_service'] ?? '') ?: null,
                'IDgen_mst_Type_Service' => $typeId,
                'status'                 => $status,
            ]);
            $created++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$created} service(s) importé(s).",
            'created' => $created,
            'errors'  => $errors,
        ]);
    }
}
