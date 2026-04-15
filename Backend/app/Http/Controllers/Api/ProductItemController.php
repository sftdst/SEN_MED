<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductItemController extends Controller
{
    public function index()
    {
        $items = DB::table('ph_mst_item')
            ->orderBy('created_dttm', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items
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

        $validated['created_user_id'] = auth()->user()?->user_id ?? 'SYSTEM';
        $validated['created_dttm'] = now();
        $validated['status_id'] = 1;

        $id = DB::table('ph_mst_item')->insertGetId($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produit créé avec succès',
            'data' => DB::table('ph_mst_item')->where('id_Rep', $id)->first()
        ], 201);
    }

    public function show($id)
    {
        $item = DB::table('ph_mst_item')->where('id_Rep', $id)->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $item
        ]);
    }

    public function update(Request $request, $id)
    {
        $item = DB::table('ph_mst_item')->where('id_Rep', $id)->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé'
            ], 404);
        }

        $validated = $request->validate([
            'item_id' => 'sometimes|string|max:20|unique:ph_mst_item,item_id,' . $id . ',id_Rep',
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

        $validated['modified_dttm'] = now();

        DB::table('ph_mst_item')->where('id_Rep', $id)->update($validated);

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