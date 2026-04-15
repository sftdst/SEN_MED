<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chambre;
use App\Models\Equipement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChambreController extends Controller
{
    // ── Chambres ──────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Chambre::with(['equipements', 'hospitalisationEnCours.patient']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nom', 'like', "%{$s}%")
                  ->orWhere('code_chambre', 'like', "%{$s}%");
            });
        }

        $chambres = $query->orderBy('code_chambre')
                          ->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data'    => $chambres,
            'meta'    => [
                'types'   => Chambre::TYPES,
                'statuts' => Chambre::STATUTS,
                'stats'   => $this->stats(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code_chambre'    => 'required|string|max:20|unique:hosp_chambres,code_chambre',
            'nom'             => 'required|string|max:100',
            'type'            => 'required|in:Standard,VIP,Réanimation,Maternité,Pédiatrie,Urgence',
            'prix_journalier' => 'required|numeric|min:0',
            'capacite'        => 'required|integer|min:1|max:20',
            'statut'          => 'in:Disponible,Occupée,Maintenance,À nettoyer',
            'description'     => 'nullable|string|max:500',
        ]);

        $chambre = Chambre::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Chambre créée avec succès.',
            'data'    => $chambre->load('equipements'),
        ], 201);
    }

    public function show(Chambre $chambre): JsonResponse
    {
        $chambre->load(['equipements', 'hospitalisations.patient', 'hospitalisationEnCours.patient']);

        return response()->json(['success' => true, 'data' => $chambre]);
    }

    public function update(Request $request, Chambre $chambre): JsonResponse
    {
        $validated = $request->validate([
            'code_chambre'    => 'sometimes|required|string|max:20|unique:hosp_chambres,code_chambre,' . $chambre->id_chambre . ',id_chambre',
            'nom'             => 'sometimes|required|string|max:100',
            'type'            => 'sometimes|required|in:Standard,VIP,Réanimation,Maternité,Pédiatrie,Urgence',
            'prix_journalier' => 'sometimes|required|numeric|min:0',
            'capacite'        => 'sometimes|required|integer|min:1|max:20',
            'statut'          => 'sometimes|in:Disponible,Occupée,Maintenance,À nettoyer',
            'description'     => 'nullable|string|max:500',
        ]);

        $chambre->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Chambre mise à jour.',
            'data'    => $chambre->load('equipements'),
        ]);
    }

    public function destroy(Chambre $chambre): JsonResponse
    {
        if ($chambre->hospitalisationEnCours()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer une chambre avec une hospitalisation en cours.',
            ], 422);
        }

        $chambre->delete();

        return response()->json(['success' => true, 'message' => 'Chambre supprimée.']);
    }

    // ── Équipements d'une chambre ─────────────────────────────────────────────

    public function equipements(Chambre $chambre): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $chambre->equipements,
        ]);
    }

    public function ajouterEquipement(Request $request, Chambre $chambre): JsonResponse
    {
        $validated = $request->validate([
            'id_equipement' => 'required|integer|exists:hosp_equipements,id_equipement',
            'quantite'      => 'integer|min:1',
            'etat'          => 'in:Fonctionnel,En panne',
        ]);

        $chambre->equipements()->syncWithoutDetaching([
            $validated['id_equipement'] => [
                'quantite' => $validated['quantite'] ?? 1,
                'etat'     => $validated['etat'] ?? 'Fonctionnel',
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Équipement ajouté.',
            'data'    => $chambre->load('equipements'),
        ]);
    }

    public function retirerEquipement(Chambre $chambre, Equipement $equipement): JsonResponse
    {
        $chambre->equipements()->detach($equipement->id_equipement);

        return response()->json(['success' => true, 'message' => 'Équipement retiré.']);
    }

    // ── CRUD Équipements ──────────────────────────────────────────────────────

    public function indexEquipements(Request $request): JsonResponse
    {
        $equipements = Equipement::when($request->filled('search'), function ($q) use ($request) {
            $q->where('nom', 'like', '%' . $request->search . '%');
        })->orderBy('nom')->get();

        return response()->json(['success' => true, 'data' => $equipements]);
    }

    public function storeEquipement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom'         => 'required|string|max:100|unique:hosp_equipements,nom',
            'description' => 'nullable|string|max:300',
        ]);

        $eq = Equipement::create($validated);

        return response()->json(['success' => true, 'message' => 'Équipement créé.', 'data' => $eq], 201);
    }

    public function updateEquipement(Request $request, Equipement $equipement): JsonResponse
    {
        $validated = $request->validate([
            'nom'         => 'sometimes|required|string|max:100|unique:hosp_equipements,nom,' . $equipement->id_equipement . ',id_equipement',
            'description' => 'nullable|string|max:300',
        ]);

        $equipement->update($validated);

        return response()->json(['success' => true, 'message' => 'Équipement mis à jour.', 'data' => $equipement]);
    }

    public function destroyEquipement(Equipement $equipement): JsonResponse
    {
        $equipement->delete();

        return response()->json(['success' => true, 'message' => 'Équipement supprimé.']);
    }

    // ── Statistiques ──────────────────────────────────────────────────────────

    private function stats(): array
    {
        $all = Chambre::selectRaw('statut, count(*) as total')->groupBy('statut')->pluck('total', 'statut');

        return [
            'total'        => Chambre::count(),
            'disponibles'  => $all['Disponible']  ?? 0,
            'occupees'     => $all['Occupée']      ?? 0,
            'maintenance'  => $all['Maintenance']  ?? 0,
            'a_nettoyer'   => $all['À nettoyer']   ?? 0,
        ];
    }

    public function dashboard(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->stats()]);
    }
}
