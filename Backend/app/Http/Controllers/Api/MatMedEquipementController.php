<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatMedEquipementController extends Controller
{
    // ── Liste / recherche ──────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = DB::table('mm_mst_equipement');

        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(function ($sub) use ($q) {
                $sub->whereRaw('LOWER(nom) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(modele) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(reference) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(numero_serie) LIKE ?', ['%' . strtolower($q) . '%']);
            });
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        if ($request->filled('categorie')) {
            $query->where('categorie', $request->input('categorie'));
        }

        // Filtre uniquement les disponibles (stock_disponible > 0)
        if ($request->boolean('disponibles_seulement')) {
            $query->where('stock_disponible', '>', 0);
        }

        $perPage = (int) $request->input('per_page', 50);
        $data    = $query->orderBy('nom')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $data->items(),
            'meta'    => [
                'total'        => $data->total(),
                'per_page'     => $data->perPage(),
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
            ],
        ]);
    }

    // ── Détail ─────────────────────────────────────────────────────────────────
    public function show($id)
    {
        $item = DB::table('mm_mst_equipement')->where('id', $id)->first();
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Équipement non trouvé'], 404);
        }

        return response()->json(['success' => true, 'data' => $item]);
    }

    // ── Création ───────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'              => 'required|string|max:200',
            'categorie'        => 'nullable|string|max:100',
            'description'      => 'nullable|string',
            'numero_serie'     => 'nullable|string|max:100',
            'modele'           => 'nullable|string|max:100',
            'reference'        => 'nullable|string|max:100',
            'nom_fournisseur'  => 'nullable|string|max:200',
            'prix_achat'       => 'nullable|numeric|min:0',
            'prix_location'    => 'nullable|numeric|min:0',
            'stock_disponible' => 'nullable|integer|min:0',
            'statut'           => 'nullable|in:actif,inactif',
        ]);

        $validated['stock_disponible']  = $validated['stock_disponible']  ?? 0;
        $validated['stock_en_location'] = 0;
        $validated['prix_achat']        = $validated['prix_achat']    ?? 0;
        $validated['prix_location']     = $validated['prix_location'] ?? 0;
        $validated['statut']            = $validated['statut']        ?? 'actif';
        $validated['created_at']        = now();
        $validated['updated_at']        = now();

        $id   = DB::table('mm_mst_equipement')->insertGetId($validated);
        $item = DB::table('mm_mst_equipement')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Équipement créé avec succès',
            'data'    => $item,
        ], 201);
    }

    // ── Mise à jour ────────────────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $item = DB::table('mm_mst_equipement')->where('id', $id)->first();
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Équipement non trouvé'], 404);
        }

        $validated = $request->validate([
            'nom'              => 'sometimes|required|string|max:200',
            'categorie'        => 'nullable|string|max:100',
            'description'      => 'nullable|string',
            'numero_serie'     => 'nullable|string|max:100',
            'modele'           => 'nullable|string|max:100',
            'reference'        => 'nullable|string|max:100',
            'nom_fournisseur'  => 'nullable|string|max:200',
            'prix_achat'       => 'nullable|numeric|min:0',
            'prix_location'    => 'nullable|numeric|min:0',
            'stock_disponible' => 'nullable|integer|min:0',
            'statut'           => 'nullable|in:actif,inactif',
        ]);

        $validated['updated_at'] = now();

        DB::table('mm_mst_equipement')->where('id', $id)->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Équipement mis à jour avec succès',
            'data'    => DB::table('mm_mst_equipement')->where('id', $id)->first(),
        ]);
    }

    // ── Suppression ────────────────────────────────────────────────────────────
    public function destroy($id)
    {
        $item = DB::table('mm_mst_equipement')->where('id', $id)->first();
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Équipement non trouvé'], 404);
        }

        // Bloquer suppression si en location
        if ($item->stock_en_location > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un équipement actuellement en location.',
            ], 422);
        }

        DB::table('mm_mst_equipement')->where('id', $id)->delete();

        return response()->json(['success' => true, 'message' => 'Équipement supprimé avec succès']);
    }

    // ── Statistiques tableau de bord ───────────────────────────────────────────
    public function stats()
    {
        $total        = DB::table('mm_mst_equipement')->count();
        $disponibles  = DB::table('mm_mst_equipement')->sum('stock_disponible');
        $en_location  = DB::table('mm_mst_equipement')->sum('stock_en_location');
        $actifs       = DB::table('mm_mst_equipement')->where('statut', 'actif')->count();

        $locations_en_cours = DB::table('mm_mst_dossier_location')
            ->whereIn('statut', ['en_cours', 'diagnostic_initial', 'retour_en_cours'])
            ->count();

        $locations_en_retard = DB::table('mm_mst_dossier_location')
            ->where('statut', 'en_cours')
            ->where('date_retour_prevue', '<', now()->toDateString())
            ->count();

        $ca_mensuel = DB::table('mm_mst_paiement_location')
            ->whereMonth('date_paiement', now()->month)
            ->whereYear('date_paiement', now()->year)
            ->sum('montant');

        return response()->json([
            'success' => true,
            'data'    => [
                'total_equipements'    => $total,
                'actifs'               => $actifs,
                'stock_disponible'     => $disponibles,
                'stock_en_location'    => $en_location,
                'locations_en_cours'   => $locations_en_cours,
                'locations_en_retard'  => $locations_en_retard,
                'ca_mensuel'           => $ca_mensuel,
            ],
        ]);
    }

    // ── Métadonnées (listes de référence) ─────────────────────────────────────
    public function metadata()
    {
        $categories = DB::table('mm_mst_equipement')
            ->whereNotNull('categorie')
            ->distinct()
            ->orderBy('categorie')
            ->pluck('categorie');

        return response()->json([
            'success' => true,
            'data'    => [
                'categories'  => $categories,
                'etats'       => ['bon', 'moyen', 'mauvais'],
                'statuts'     => ['actif', 'inactif'],
                'statuts_location' => [
                    'en_attente_diagnostic',
                    'diagnostic_initial',
                    'en_cours',
                    'retour_en_cours',
                    'cloture',
                    'en_retard',
                ],
            ],
        ]);
    }
}
