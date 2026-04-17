<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApprovisionnementController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('ph_mst_approvisionnement')->orderBy('created_at', 'desc');

        if ($request->has('fournisseur_id') && $request->fournisseur_id) {
            $query->where('fournisseur_id', $request->fournisseur_id);
        }
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        if ($request->has('date_debut') && $request->date_debut) {
            $query->where('date_approvisionnement', '>=', $request->date_debut);
        }
        if ($request->has('date_fin') && $request->date_fin) {
            $query->where('date_approvisionnement', '<=', $request->date_fin);
        }

        $approvisionnements = $query->get();
        
        foreach ($approvisionnements as $app) {
            $app->fournisseur = $app->fournisseur_id 
                ? DB::table('ph_mst_fournisseur')->where('id_Rep', $app->fournisseur_id)->first() 
                : null;
            $app->commande = $app->commande_id 
                ? DB::table('ph_mst_commande')->where('id_Rep', $app->commande_id)->first() 
                : null;
        }

        return response()->json(['success' => true, 'data' => $approvisionnements]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'commande_id' => 'nullable|exists:ph_mst_commande,id_Rep',
            'fournisseur_id' => 'nullable|exists:ph_mst_fournisseur,id_Rep',
            'date_approvisionnement' => 'required|date',
            'type' => 'nullable|string|max:30',
            'montant_total' => 'nullable|numeric',
            'observations' => 'nullable|string',
        ]);

        $validated['type'] = $validated['type'] ?? 'commande';
        $validated['montant_total'] = $validated['montant_total'] ?? 0;
        $validated['created_user_id'] = auth()->user()?->user_id ?? 'SYSTEM';

        $id = DB::table('ph_mst_approvisionnement')->insertGetId($validated);

        return response()->json([
            'success' => true,
            'message' => 'Approvisionnement enregistré',
            'data' => DB::table('ph_mst_approvisionnement')->where('id_Rep', $id)->first()
        ], 201);
    }

    public function show($id)
    {
        $appro = DB::table('ph_mst_approvisionnement')->where('id_Rep', $id)->first();
        
        if (!$appro) {
            return response()->json(['success' => false, 'message' => 'Approvisionnement non trouvé'], 404);
        }

        return response()->json(['success' => true, 'data' => $appro]);
    }

    public function update(Request $request, $id)
    {
        $appro = DB::table('ph_mst_approvisionnement')->where('id_Rep', $id)->first();
        
        if (!$appro) {
            return response()->json(['success' => false, 'message' => 'Approvisionnement non trouvé'], 404);
        }

        $validated = $request->validate([
            'commande_id' => 'nullable|exists:ph_mst_commande,id_Rep',
            'fournisseur_id' => 'nullable|exists:ph_mst_fournisseur,id_Rep',
            'date_approvisionnement' => 'sometimes|date',
            'type' => 'nullable|string|max:30',
            'montant_total' => 'nullable|numeric',
            'observations' => 'nullable|string',
        ]);

        $validated['updated_at'] = now();
        DB::table('ph_mst_approvisionnement')->where('id_Rep', $id)->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Approvisionnement mis à jour',
            'data' => DB::table('ph_mst_approvisionnement')->where('id_Rep', $id)->first()
        ]);
    }

    public function destroy($id)
    {
        $appro = DB::table('ph_mst_approvisionnement')->where('id_Rep', $id)->first();
        
        if (!$appro) {
            return response()->json(['success' => false, 'message' => 'Approvisionnement non trouvé'], 404);
        }

        DB::table('ph_mst_approvisionnement')->where('id_Rep', $id)->delete();

        return response()->json(['success' => true, 'message' => 'Approvisionnement supprimé']);
    }

    public function stats()
    {
        $total = DB::table('ph_mst_approvisionnement')->sum('montant_total');
        $count = DB::table('ph_mst_approvisionnement')->count();
        
        $parMois = DB::table('ph_mst_approvisionnement')
            ->select(DB::raw('MONTH(date_approvisionnement) as mois'), DB::raw('SUM(montant_total) as total'))
            ->whereYear('date_approvisionnement', date('Y'))
            ->groupBy('mois')
            ->get();

        return response()->json(['success' => true, 'data' => [
            'total' => $total,
            'count' => $count,
            'par_mois' => $parMois
        ]]);
    }
}