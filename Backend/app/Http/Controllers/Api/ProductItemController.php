<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductItemController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('ph_mst_item')->where('status_id', 1);

        // Recherche texte (autocomplete) — filtre sur description ou item_id
        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(function ($sub) use ($q) {
                $sub->whereRaw('LOWER(description) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(item_id) LIKE ?', ['%' . strtolower($q) . '%']);
            });
        }

        $limit = (int) $request->input('limit', 200);
        $items = $query->orderBy('description')->limit($limit)
            ->get(['id_Rep', 'item_id', 'description', 'PrixVente', 'prixcAchat', 'posologie', 'voie_administration']);

        return response()->json([
            'success' => true,
            'data'    => $items,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|string|max:20|unique:ph_mst_item',
            'description' => 'nullable|string|max:255',
            'days' => 'nullable|integer',
            'default_qty' => 'nullable|integer',
            'duration' => 'nullable|integer',
            'duration_type' => 'nullable|string|max:20',
            'food_type' => 'nullable|string|max:20',
            'vidal_id' => 'nullable|string|max:15',
            'code_CpHa_id' => 'nullable|string|max:50',
            'posologie' => 'nullable|string|max:50',
            'renew' => 'nullable|integer',
            'subustitution' => 'nullable|integer',
            'for_all_prescription' => 'nullable|integer',
            'ucd' => 'nullable|string|max:50',
            'voie_administration' => 'nullable|string|max:50',
            'remarques' => 'nullable|string|max:50',
            'preference_substitution' => 'nullable|string|max:50',
            'midi' => 'nullable|string|max:50',
            'soir' => 'nullable|string|max:50',
            'couche' => 'nullable|string|max:50',
            'qty_vrac' => 'nullable|integer',
            'dddadulte' => 'nullable|integer',
            'dddpediatr' => 'nullable|integer',
            'max_prise' => 'nullable|integer',
            'matin' => 'nullable|string|max:50',
            'prixcAchat' => 'nullable|integer',
            'PrixVente' => 'nullable|integer',
        ]);

        $validated['created_user_id'] = auth()->id() ? (string)auth()->id() : 'SYSTEM';
        $validated['created_dttm'] = now();
        $validated['status_id'] = 1;

        // Champs NOT NULL: remplacer null par 0 (default de la migration)
        $intFields = ['duration', 'renew', 'subustitution', 'for_all_prescription',
                      'qty_vrac', 'dddadulte', 'dddpediatr', 'max_prise',
                      'prixcAchat', 'PrixVente'];
        foreach ($intFields as $field) {
            if (!isset($validated[$field]) || $validated[$field] === null) {
                $validated[$field] = 0;
            }
        }

        $id = DB::table('ph_mst_item')->insertGetId($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produit mis à jour avec succès',
            'data' => DB::table('ph_mst_item')->where('id_Rep', $id)->first()
        ]);
    }

    public function destroy($id)
    {
        $item = DB::table('ph_mst_item')->where('id_Rep', $id)->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé'
            ], 404);
        }

        DB::table('ph_mst_item')->where('id_Rep', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produit supprimé avec succès'
        ]);
    }

    public function metadata()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'voie_administration' => [
                    'Orale', 'Intraveineuse', 'Intramusculaire', 'Sous-cutanée', 
                    'Rectale', 'Inhalation', 'Transdermique', 'Oculaire', 
                    'Auriculaire', 'Nasale', 'Locale'
                ],
                'duration_type' => ['jour', 'semaine', 'mois', 'annee'],
                'food_type' => ['avant', 'pendant', 'apres', 'indifferent']
            ]
        ]);
    }
}