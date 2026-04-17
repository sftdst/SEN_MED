<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventaireController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('ph_mst_inventaire')->orderBy('created_at', 'desc');

        if ($request->has('statut') && $request->statut) {
            $query->where('statut', $request->statut);
        }

        $inventaires = $query->get();

        foreach ($inventaires as $inv) {
            $inv->details_count = DB::table('ph_mst_inventaire_detail')
                ->where('inventaire_id', $inv->id_Rep)
                ->count();
            $inv->ecart_total = DB::table('ph_mst_inventaire_detail')
                ->where('inventaire_id', $inv->id_Rep)
                ->sum('ecart');
        }

        return response()->json(['success' => true, 'data' => $inventaires]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date_inventaire' => 'required|date',
            'observations' => 'nullable|string',
        ]);

        $validated['numero_inventaire'] = 'INV-' . date('Ymd') . '-' . rand(1000, 9999);
        $validated['statut'] = 'en_cours';
        $validated['created_user_id'] = auth()->user()?->user_id ?? 'SYSTEM';

        $id = DB::table('ph_mst_inventaire')->insertGetId($validated);

        $items = DB::table('ph_mst_item')->get();
        foreach ($items as $item) {
            $stock = DB::table('ph_mst_stock')->where('item_id', $item->id_Rep)->first();
            DB::table('ph_mst_inventaire_detail')->insert([
                'inventaire_id' => $id,
                'item_id' => $item->id_Rep,
                'stock_theorique' => $stock ? $stock->quantite : 0,
                'stock_physique' => $stock ? $stock->quantite : 0,
                'ecart' => 0
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inventaire créé',
            'data' => DB::table('ph_mst_inventaire')->where('id_Rep', $id)->first()
        ], 201);
    }

    public function show($id)
    {
        $inventaire = DB::table('ph_mst_inventaire')->where('id_Rep', $id)->first();
        
        if (!$inventaire) {
            return response()->json(['success' => false, 'message' => 'Inventaire non trouvé'], 404);
        }

        $details = DB::table('ph_mst_inventaire_detail')
            ->where('inventaire_id', $id)
            ->get();

        foreach ($details as $det) {
            $det->item = DB::table('ph_mst_item')->where('id_Rep', $det->item_id)->first();
        }

        return response()->json([
            'success' => true,
            'data' => $inventaire,
            'details' => $details
        ]);
    }

    public function updateDetail(Request $request, $id)
    {
        $detail = DB::table('ph_mst_inventaire_detail')->where('id_Rep', $id)->first();
        
        if (!$detail) {
            return response()->json(['success' => false, 'message' => 'Detail non trouvé'], 404);
        }

        $validated = $request->validate([
            'stock_physique' => 'required|numeric|min:0',
            'observation' => 'nullable|string',
        ]);

        $validated['ecart'] = $validated['stock_physique'] - $detail->stock_theorique;
        $validated['updated_at'] = now();

        DB::table('ph_mst_inventaire_detail')->where('id_Rep', $id)->update($validated);

        return response()->json(['success' => true, 'message' => 'Stock mis à jour']);
    }

    public function cloturer(Request $request, $id)
    {
        $inventaire = DB::table('ph_mst_inventaire')->where('id_Rep', $id)->first();
        
        if (!$inventaire) {
            return response()->json(['success' => false, 'message' => 'Inventaire non trouvé'], 404);
        }

        DB::table('ph_mst_inventaire')->where('id_Rep', $id)->update([
            'statut' => 'termine',
            'date_fin' => now(),
            'observations' => $request->observations ?? $inventaire->observations,
            'updated_at' => now()
        ]);

        $details = DB::table('ph_mst_inventaire_detail')->where('inventaire_id', $id)->get();
        foreach ($details as $det) {
            if ($det->ecart != 0) {
                DB::table('ph_mst_stock')->where('item_id', $det->item_id)->update([
                    'quantite' => $det->stock_physique,
                    'updated_at' => now()
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Inventaire cloturé']);
    }

    public function destroy($id)
    {
        $inventaire = DB::table('ph_mst_inventaire')->where('id_Rep', $id)->first();
        
        if (!$inventaire) {
            return response()->json(['success' => false, 'message' => 'Inventaire non trouvé'], 404);
        }

        DB::table('ph_mst_inventaire_detail')->where('inventaire_id', $id)->delete();
        DB::table('ph_mst_inventaire')->where('id_Rep', $id)->delete();

        return response()->json(['success' => true, 'message' => 'Inventaire supprimé']);
    }
}