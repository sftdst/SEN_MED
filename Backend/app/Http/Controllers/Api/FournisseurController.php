<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FournisseurController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('ph_mst_fournisseur')->orderBy('created_at', 'desc');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->actif === 'true' || $request->actif === '1');
        }

        $fournisseurs = $query->get();

        return response()->json([
            'success' => true,
            'data' => $fournisseurs
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:ph_mst_fournisseur',
            'nom' => 'required|string|max:150',
            'pays' => 'nullable|string|max:100',
            'ville' => 'nullable|string|max:100',
            'adresse' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'site_web' => 'nullable|string|max:150',
            'nom_responsable' => 'nullable|string|max:150',
            'tel_responsable' => 'nullable|string|max:50',
            'monnaie' => 'nullable|string|max:10',
            'swift' => 'nullable|string|max:50',
            'iban' => 'nullable|string|max:50',
            'numero_compte' => 'nullable|string|max:50',
            'banque' => 'nullable|string|max:100',
            'remarques' => 'nullable|string',
            'actif' => 'nullable|boolean',
            'produits' => 'nullable|array',
            'produits.*.produit_id' => 'required|exists:ph_mst_item,id_Rep',
            'produits.*.prix' => 'nullable|numeric|min:0',
            'produits.*.devise' => 'nullable|string|max:10',
            'produits.*.delai_livraison' => 'nullable|integer|min:0',
            'produits.*.quantite_minimale' => 'nullable|integer|min:1',
            'produits.*.remise' => 'nullable|numeric|min:0|max:100',
        ]);

        $validated['created_user_id'] = auth()->user()?->user_id ?? 'SYSTEM';
        $validated['actif'] = $validated['actif'] ?? true;
        $validated['monnaie'] = $validated['monnaie'] ?? 'FCFA';

        $produits = $validated['produits'] ?? [];
        unset($validated['produits']);

        $id = DB::table('ph_mst_fournisseur')->insertGetId($validated);

        if (!empty($produits)) {
            foreach ($produits as $prod) {
                DB::table('ph_mst_fournisseur_produit')->insert([
                    'fournisseur_id' => $id,
                    'produit_id' => $prod['produit_id'],
                    'prix' => $prod['prix'] ?? 0,
                    'devise' => $prod['devise'] ?? 'FCFA',
                    'delai_livraison' => $prod['delai_livraison'] ?? null,
                    'quantite_minimale' => $prod['quantite_minimale'] ?? 1,
                    'remise' => $prod['remise'] ?? 0,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur créé avec succès',
            'data' => $this->getFournisseurWithProduits($id)
        ], 201);
    }

    public function show($id)
    {
        $fournisseur = DB::table('ph_mst_fournisseur')->where('id_Rep', $id)->first();

        if (!$fournisseur) {
            return response()->json([
                'success' => false,
                'message' => 'Fournisseur non trouvé'
            ], 404);
        }

        $fournisseur->produits = $this->getProduits($id);

        return response()->json([
            'success' => true,
            'data' => $fournisseur
        ]);
    }

    public function update(Request $request, $id)
    {
        $fournisseur = DB::table('ph_mst_fournisseur')->where('id_Rep', $id)->first();

        if (!$fournisseur) {
            return response()->json([
                'success' => false,
                'message' => 'Fournisseur non trouvé'
            ], 404);
        }

        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:ph_mst_fournisseur,code,' . $id . ',id_Rep',
            'nom' => 'sometimes|string|max:150',
            'pays' => 'nullable|string|max:100',
            'ville' => 'nullable|string|max:100',
            'adresse' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'site_web' => 'nullable|string|max:150',
            'nom_responsable' => 'nullable|string|max:150',
            'tel_responsable' => 'nullable|string|max:50',
            'monnaie' => 'nullable|string|max:10',
            'swift' => 'nullable|string|max:50',
            'iban' => 'nullable|string|max:50',
            'numero_compte' => 'nullable|string|max:50',
            'banque' => 'nullable|string|max:100',
            'remarques' => 'nullable|string',
            'actif' => 'nullable|boolean',
            'produits' => 'nullable|array',
            'produits.*.produit_id' => 'required|exists:ph_mst_item,id_Rep',
            'produits.*.prix' => 'nullable|numeric|min:0',
            'produits.*.devise' => 'nullable|string|max:10',
            'produits.*.delai_livraison' => 'nullable|integer|min:0',
            'produits.*.quantite_minimale' => 'nullable|integer|min:1',
            'produits.*.remise' => 'nullable|numeric|min:0|max:100',
        ]);

        $validated['updated_at'] = now();

        $produits = $validated['produits'] ?? null;
        unset($validated['produits']);

        DB::table('ph_mst_fournisseur')->where('id_Rep', $id)->update($validated);

        if ($produits !== null) {
            DB::table('ph_mst_fournisseur_produit')->where('fournisseur_id', $id)->delete();
            foreach ($produits as $prod) {
                DB::table('ph_mst_fournisseur_produit')->insert([
                    'fournisseur_id' => $id,
                    'produit_id' => $prod['produit_id'],
                    'prix' => $prod['prix'] ?? 0,
                    'devise' => $prod['devise'] ?? 'FCFA',
                    'delai_livraison' => $prod['delai_livraison'] ?? null,
                    'quantite_minimale' => $prod['quantite_minimale'] ?? 1,
                    'remise' => $prod['remise'] ?? 0,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur mis à jour avec succès',
            'data' => $this->getFournisseurWithProduits($id)
        ]);
    }

    public function destroy($id)
    {
        $fournisseur = DB::table('ph_mst_fournisseur')->where('id_Rep', $id)->first();

        if (!$fournisseur) {
            return response()->json([
                'success' => false,
                'message' => 'Fournisseur non trouvé'
            ], 404);
        }

        DB::table('ph_mst_fournisseur_produit')->where('fournisseur_id', $id)->delete();
        DB::table('ph_mst_fournisseur')->where('id_Rep', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur supprimé avec succès'
        ]);
    }

    private function getFournisseurWithProduits($id)
    {
        $fournisseur = DB::table('ph_mst_fournisseur')->where('id_Rep', $id)->first();
        $fournisseur->produits = $this->getProduits($id);
        return $fournisseur;
    }

    private function getProduits($fournisseurId)
    {
        return DB::table('ph_mst_fournisseur_produit')
            ->where('fournisseur_id', $fournisseurId)
            ->get()
            ->map(function ($item) {
                $item->produit = DB::table('ph_mst_item')->where('id_Rep', $item->produit_id)->first();
                return $item;
            });
    }
}