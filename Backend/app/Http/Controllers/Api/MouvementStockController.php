<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MouvementStockController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('ph_mst_mouvement_stock')
            ->orderBy('created_at', 'desc');

        if ($request->has('item_id') && $request->item_id) {
            $query->where('item_id', $request->item_id);
        }
        if ($request->has('type_mouvement') && $request->type_mouvement) {
            $query->where('type_mouvement', $request->type_mouvement);
        }
        if ($request->has('date_debut') && $request->date_debut) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        if ($request->has('date_fin') && $request->date_fin) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        $mouvements = $query->get();
        
        foreach ($mouvements as $mvt) {
            $mvt->item = DB::table('ph_mst_item')->where('id_Rep', $mvt->item_id)->first();
        }

        return response()->json(['success' => true, 'data' => $mouvements]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:ph_mst_item,id_Rep',
            'type_mouvement' => 'required|in:entree,sortie,ajustement,transfert',
            'quantite' => 'required|numeric|min:0.01',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'motif' => 'nullable|string|max:100',
            'reference_id' => 'nullable|integer',
            'reference_type' => 'nullable|string|max:50',
        ]);

        $currentStock = DB::table('ph_mst_stock')->where('item_id', $validated['item_id'])->first();
        $stockAvant = $currentStock ? $currentStock->quantite : 0;
        
        $validated['stock_avant'] = $stockAvant;
        
        if ($validated['type_mouvement'] === 'entree') {
            $validated['stock_apres'] = $stockAvant + $validated['quantite'];
        } else {
            $validated['stock_apres'] = max(0, $stockAvant - $validated['quantite']);
        }

        $validated['created_user_id'] = auth()->user()?->user_id ?? 'SYSTEM';

        $id = DB::table('ph_mst_mouvement_stock')->insertGetId($validated);

        if ($currentStock) {
            DB::table('ph_mst_stock')->where('item_id', $validated['item_id'])->update([
                'quantite' => $validated['stock_apres'],
                'updated_at' => now()
            ]);
        } else {
            DB::table('ph_mst_stock')->insert([
                'item_id' => $validated['item_id'],
                'quantite' => $validated['stock_apres'],
                'created_user_id' => $validated['created_user_id'],
                'created_at' => now()
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mouvement enregistré',
            'data' => DB::table('ph_mst_mouvement_stock')->where('id_Rep', $id)->first()
        ], 201);
    }

    public function historique($itemId)
    {
        $mouvements = DB::table('ph_mst_mouvement_stock')
            ->where('item_id', $itemId)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'data' => $mouvements]);
    }

    public function stats()
    {
        $entrees = DB::table('ph_mst_mouvement_stock')
            ->where('type_mouvement', 'entree')
            ->count();
        $sorties = DB::table('ph_mst_mouvement_stock')
            ->where('type_mouvement', 'sortie')
            ->count();

        return response()->json(['success' => true, 'data' => [
            'entrees' => $entrees,
            'sorties' => $sorties
        ]]);
    }
}