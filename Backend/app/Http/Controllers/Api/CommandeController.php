<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommandeController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('ph_mst_commande')->orderBy('created_at', 'desc');

        if ($request->has('statut') && $request->statut) {
            $query->where('statut', $request->statut);
        }
        if ($request->has('fournisseur_id') && $request->fournisseur_id) {
            $query->where('fournisseur_id', $request->fournisseur_id);
        }
        if ($request->has('search') && $request->search) {
            $query->where('numero_commande', 'like', "%{$request->search}%");
        }

        $commandes = $query->get();
        
        foreach ($commandes as $cmd) {
            $cmd->fournisseur = $cmd->fournisseur_id 
                ? DB::table('ph_mst_fournisseur')->where('id_Rep', $cmd->fournisseur_id)->first() 
                : null;
            $cmd->produits = DB::table('ph_mst_detail_commande')
                ->where('commande_id', $cmd->id_Rep)
                ->get()
                ->map(function ($detail) {
                    $detail->produit = DB::table('ph_mst_item')->where('id_Rep', $detail->produit_id)->first();
                    return $detail;
                });
        }

        return response()->json(['success' => true, 'data' => $commandes]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fournisseur_id' => 'nullable|exists:ph_mst_fournisseur,id_Rep',
            'date_commande' => 'required|date',
            'date_livration_prevue' => 'nullable|date',
            'observations' => 'nullable|string',
            'type_commande' => 'nullable|string|max:50',
            'lieu_reception' => 'nullable|string|max:150',
            'statut' => 'nullable|string|in:en_attente,confirmee,livree,annulee',
            'produits' => 'nullable|array',
            'produits.*.produit_id' => 'required_with:produits|exists:ph_mst_item,id_Rep',
            'produits.*.quantite' => 'required_with:produits|numeric|min:0',
            'produits.*.prix_achat' => 'required_with:produits|numeric|min:0',
            'produits.*.tva' => 'nullable|numeric|min:0|max:100',
        ]);

        // Générer numéro commande
        $validated['numero_commande'] = 'CMD-' . date('Ymd') . '-' . rand(1000, 9999);
        $validated['statut'] = $validated['statut'] ?? 'en_attente';
        $validated['montant_total'] = 0;
        $validated['created_user_id'] = auth()->user()?->user_id ?? 'SYSTEM';

        $produits = $validated['produits'] ?? [];
        unset($validated['produits']);

        DB::beginTransaction();
        try {
            $id = DB::table('ph_mst_commande')->insertGetId($validated);
            
            $montantTotal = 0;
            if (!empty($produits)) {
                foreach ($produits as $prod) {
                    $quantite = $prod['quantite'] ?? 0;
                    $prix = $prod['prix_achat'] ?? 0;
                    $tva = $prod['tva'] ?? 0;
                    $montantHT = $quantite * $prix;
                    $montantTTC = $montantHT * (1 + ($tva / 100));
                    
                    DB::table('ph_mst_detail_commande')->insert([
                        'commande_id' => $id,
                        'produit_id' => $prod['produit_id'],
                        'quantite' => $quantite,
                        'prix_achat' => $prix,
                        'tva' => $tva,
                        'montant_ht' => $montantHT,
                        'montant_ttc' => $montantTTC,
                        'created_user_id' => auth()->user()?->user_id ?? 'SYSTEM',
                    ]);
                    
                    $montantTotal += $montantTTC;
                }
            }

            DB::table('ph_mst_commande')->where('id_Rep', $id)->update(['montant_total' => $montantTotal]);

            DB::commit();

            $commande = DB::table('ph_mst_commande')->where('id_Rep', $id)->first();
            $commande->fournisseur = $commande->fournisseur_id 
                ? DB::table('ph_mst_fournisseur')->where('id_Rep', $commande->fournisseur_id)->first() 
                : null;
            $commande->produits = DB::table('ph_mst_detail_commande')
                ->where('commande_id', $id)
                ->get()
                ->map(function ($detail) {
                    $detail->produit = DB::table('ph_mst_item')->where('id_Rep', $detail->produit_id)->first();
                    return $detail;
                });

            return response()->json([
                'success' => true,
                'message' => 'Commande créée avec succès',
                'data' => $commande
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $commande = DB::table('ph_mst_commande')->where('id_Rep', $id)->first();
        
        if (!$commande) {
            return response()->json(['success' => false, 'message' => 'Commande non trouvée'], 404);
        }

        $commande->fournisseur = $commande->fournisseur_id 
            ? DB::table('ph_mst_fournisseur')->where('id_Rep', $commande->fournisseur_id)->first() 
            : null;

        $commande->produits = DB::table('ph_mst_detail_commande')
            ->where('commande_id', $id)
            ->get()
            ->map(function ($detail) {
                $detail->produit = DB::table('ph_mst_item')->where('id_Rep', $detail->produit_id)->first();
                return $detail;
            });

        return response()->json(['success' => true, 'data' => $commande]);
    }

    public function update(Request $request, $id)
    {
        $commande = DB::table('ph_mst_commande')->where('id_Rep', $id)->first();
        
        if (!$commande) {
            return response()->json(['success' => false, 'message' => 'Commande non trouvée'], 404);
        }

        $validated = $request->validate([
            'fournisseur_id' => 'nullable|exists:ph_mst_fournisseur,id_Rep',
            'date_commande' => 'sometimes|date',
            'date_livration_prevue' => 'nullable|date',
            'statut' => 'sometimes|in:en_attente,confirmee,livree,annulee',
            'montant_total' => 'sometimes|numeric',
            'observations' => 'nullable|string',
            'type_commande' => 'nullable|string|max:50',
            'lieu_reception' => 'nullable|string|max:150',
            'produits' => 'nullable|array',
            'produits.*.id' => 'nullable|exists:ph_mst_detail_commande,id_Rep',
            'produits.*.produit_id' => 'required_with:produits|exists:ph_mst_item,id_Rep',
            'produits.*.quantite' => 'required_with:produits|numeric|min:0',
            'produits.*.prix_achat' => 'required_with:produits|numeric|min:0',
            'produits.*.tva' => 'nullable|numeric|min:0|max:100',
        ]);

        if (isset($validated['produits'])) {
            $produits = $validated['produits'];
            unset($validated['produits']);
            
            DB::table('ph_mst_detail_commande')->where('commande_id', $id)->delete();
            
            $montantTotal = 0;
            foreach ($produits as $prod) {
                $quantite = $prod['quantite'] ?? 0;
                $prix = $prod['prix_achat'] ?? 0;
                $tva = $prod['tva'] ?? 0;
                $montantHT = $quantite * $prix;
                $montantTTC = $montantHT * (1 + ($tva / 100));
                
                DB::table('ph_mst_detail_commande')->insert([
                    'commande_id' => $id,
                    'produit_id' => $prod['produit_id'],
                    'quantite' => $quantite,
                    'prix_achat' => $prix,
                    'tva' => $tva,
                    'montant_ht' => $montantHT,
                    'montant_ttc' => $montantTTC,
                    'created_user_id' => auth()->user()?->user_id ?? 'SYSTEM',
                ]);
                
                $montantTotal += $montantTTC;
            }
            $validated['montant_total'] = $montantTotal;
        }

        $validated['updated_at'] = now();
        DB::table('ph_mst_commande')->where('id_Rep', $id)->update($validated);

        $commande = DB::table('ph_mst_commande')->where('id_Rep', $id)->first();
        $commande->fournisseur = $commande->fournisseur_id 
            ? DB::table('ph_mst_fournisseur')->where('id_Rep', $commande->fournisseur_id)->first() 
            : null;
        $commande->produits = DB::table('ph_mst_detail_commande')
            ->where('commande_id', $id)
            ->get()
            ->map(function ($detail) {
                $detail->produit = DB::table('ph_mst_item')->where('id_Rep', $detail->produit_id)->first();
                return $detail;
            });

        return response()->json([
            'success' => true,
            'message' => 'Commande mise à jour',
            'data' => $commande
        ]);
    }

    public function destroy($id)
    {
        $commande = DB::table('ph_mst_commande')->where('id_Rep', $id)->first();
        
        if (!$commande) {
            return response()->json(['success' => false, 'message' => 'Commande non trouvée'], 404);
        }

        DB::table('ph_mst_detail_commande')->where('commande_id', $id)->delete();
        DB::table('ph_mst_commande')->where('id_Rep', $id)->delete();

        return response()->json(['success' => true, 'message' => 'Commande supprimée']);
    }

    public function listeParStatut()
    {
        $stats = DB::table('ph_mst_commande')
            ->select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut')
            ->get();

        return response()->json(['success' => true, 'data' => $stats]);
    }
}
