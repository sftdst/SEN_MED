<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatMedLocationController extends Controller
{
    // ── Génération du numéro de dossier ────────────────────────────────────────
    private function genererNumeroDossier(): string
    {
        $annee  = now()->format('Y');
        $mois   = now()->format('m');
        $prefix = "LOC-{$annee}{$mois}-";

        $dernier = DB::table('mm_mst_dossier_location')
            ->where('numero_dossier', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->value('numero_dossier');

        $seq = $dernier ? ((int) substr($dernier, strlen($prefix)) + 1) : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    // ── Liste des dossiers ─────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = DB::table('mm_mst_dossier_location as d')
            ->select([
                'd.*',
                DB::raw("(SELECT COUNT(*) FROM mm_mst_location_ligne WHERE dossier_id = d.id) as nb_lignes"),
            ]);

        if ($request->filled('statut')) {
            $query->where('d.statut', $request->input('statut'));
        }

        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(function ($sub) use ($q) {
                $sub->whereRaw('LOWER(d.numero_dossier) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(d.client_nom) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(d.client_prenom) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(d.client_telephone) LIKE ?', ['%' . strtolower($q) . '%']);
            });
        }

        // Alerte retards en temps réel
        DB::table('mm_mst_dossier_location')
            ->where('statut', 'en_cours')
            ->where('date_retour_prevue', '<', now()->toDateString())
            ->update(['statut' => 'en_retard', 'updated_at' => now()]);

        $perPage = (int) $request->input('per_page', 20);
        $data    = $query->orderBy('d.created_at', 'desc')->paginate($perPage);

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

    // ── Détail d'un dossier ────────────────────────────────────────────────────
    public function show($id)
    {
        $dossier = DB::table('mm_mst_dossier_location')->where('id', $id)->first();
        if (!$dossier) {
            return response()->json(['success' => false, 'message' => 'Dossier non trouvé'], 404);
        }

        $lignes = DB::table('mm_mst_location_ligne as l')
            ->join('mm_mst_equipement as e', 'l.equipement_id', '=', 'e.id')
            ->where('l.dossier_id', $id)
            ->select(['l.*', 'e.nom as equipement_nom', 'e.modele', 'e.reference', 'e.numero_serie'])
            ->get();

        $diagnostics = DB::table('mm_mst_diagnostic')
            ->where('dossier_id', $id)
            ->orderBy('date_diagnostic')
            ->get();

        $paiements = DB::table('mm_mst_paiement_location')
            ->where('dossier_id', $id)
            ->orderBy('date_paiement')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => array_merge((array) $dossier, [
                'lignes'      => $lignes,
                'diagnostics' => $diagnostics,
                'paiements'   => $paiements,
            ]),
        ]);
    }

    // ── Étape 1 : Création du dossier ──────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date_location'      => 'required|date',
            'date_retour_prevue' => 'required|date|after_or_equal:date_location',
            'client_nom'         => 'required|string|max:100',
            'client_prenom'      => 'required|string|max:100',
            'client_telephone'   => 'nullable|string|max:20',
            'client_piece_identite' => 'nullable|string|max:100',
            'lignes'             => 'required|array|min:1',
            'lignes.*.equipement_id'       => 'required|integer|exists:mm_mst_equipement,id',
            'lignes.*.quantite'            => 'required|integer|min:1',
            'lignes.*.prix_unitaire_location' => 'nullable|numeric|min:0',
        ]);

        // Vérifier la disponibilité du stock pour chaque ligne
        foreach ($validated['lignes'] as $ligne) {
            $equipement = DB::table('mm_mst_equipement')->where('id', $ligne['equipement_id'])->first();
            if (!$equipement) {
                return response()->json(['success' => false, 'message' => "Équipement #{$ligne['equipement_id']} introuvable"], 422);
            }
            if ($equipement->stock_disponible < $ligne['quantite']) {
                return response()->json([
                    'success' => false,
                    'message' => "Stock insuffisant pour « {$equipement->nom} » : {$equipement->stock_disponible} disponible(s), {$ligne['quantite']} demandé(s).",
                ], 422);
            }
        }

        return DB::transaction(function () use ($validated, $request) {
            $montantTotal = 0;

            // Calculer le montant total
            foreach ($validated['lignes'] as $ligne) {
                $equipement = DB::table('mm_mst_equipement')->where('id', $ligne['equipement_id'])->first();
                $prixUnit   = $ligne['prix_unitaire_location'] ?? $equipement->prix_location;
                $montantTotal += $prixUnit * $ligne['quantite'];
            }

            $acompte  = round($montantTotal * 0.5, 2);
            $reliquat = round($montantTotal - $acompte, 2);

            $dossierId = DB::table('mm_mst_dossier_location')->insertGetId([
                'numero_dossier'       => $this->genererNumeroDossier(),
                'date_location'        => $validated['date_location'],
                'date_retour_prevue'   => $validated['date_retour_prevue'],
                'client_nom'           => $validated['client_nom'],
                'client_prenom'        => $validated['client_prenom'],
                'client_telephone'     => $validated['client_telephone'] ?? null,
                'client_piece_identite'=> $validated['client_piece_identite'] ?? null,
                'montant_total'        => $montantTotal,
                'acompte'              => $acompte,
                'reliquat'             => $reliquat,
                'penalite'             => 0,
                'statut'               => 'en_attente_diagnostic',
                'created_by'           => auth()->id(),
                'created_at'           => now(),
                'updated_at'           => now(),
            ]);

            // Insérer les lignes
            foreach ($validated['lignes'] as $ligne) {
                $equipement = DB::table('mm_mst_equipement')->where('id', $ligne['equipement_id'])->first();
                $prixUnit   = $ligne['prix_unitaire_location'] ?? $equipement->prix_location;
                DB::table('mm_mst_location_ligne')->insert([
                    'dossier_id'             => $dossierId,
                    'equipement_id'          => $ligne['equipement_id'],
                    'quantite'               => $ligne['quantite'],
                    'prix_unitaire_location' => $prixUnit,
                    'montant_ligne'          => $prixUnit * $ligne['quantite'],
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ]);
            }

            $dossier = DB::table('mm_mst_dossier_location')->where('id', $dossierId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Dossier de location créé. Veuillez effectuer le diagnostic initial.',
                'data'    => $dossier,
            ], 201);
        });
    }

    // ── Étape 2 : Diagnostic initial / retour ──────────────────────────────────
    public function ajouterDiagnostic(Request $request, $id)
    {
        $dossier = DB::table('mm_mst_dossier_location')->where('id', $id)->first();
        if (!$dossier) {
            return response()->json(['success' => false, 'message' => 'Dossier non trouvé'], 404);
        }

        $validated = $request->validate([
            'type_diagnostic' => 'required|in:initial,retour',
            'etat_general'    => 'required|in:bon,moyen,mauvais',
            'observations'    => 'nullable|string',
            'signataire'      => 'nullable|string|max:200',
        ]);

        // Vérifier cohérence du workflow
        if ($validated['type_diagnostic'] === 'initial' && $dossier->statut !== 'en_attente_diagnostic') {
            return response()->json(['success' => false, 'message' => 'Le diagnostic initial a déjà été effectué.'], 422);
        }
        if ($validated['type_diagnostic'] === 'retour' && !in_array($dossier->statut, ['en_cours', 'en_retard'])) {
            return response()->json(['success' => false, 'message' => 'Le dossier doit être en cours pour un diagnostic retour.'], 422);
        }

        DB::table('mm_mst_diagnostic')->insert([
            'dossier_id'      => $id,
            'type_diagnostic' => $validated['type_diagnostic'],
            'etat_general'    => $validated['etat_general'],
            'observations'    => $validated['observations'] ?? null,
            'signataire'      => $validated['signataire'] ?? null,
            'date_diagnostic' => now(),
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        // Mettre à jour le statut du dossier
        $nouveauStatut = $validated['type_diagnostic'] === 'initial' ? 'diagnostic_initial' : 'retour_en_cours';
        DB::table('mm_mst_dossier_location')->where('id', $id)->update([
            'statut'     => $nouveauStatut,
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Diagnostic enregistré avec succès.',
            'data'    => ['statut' => $nouveauStatut],
        ]);
    }

    // ── Étape 3 : Encaissement de l'acompte (50%) ─────────────────────────────
    public function encaisserAcompte(Request $request, $id)
    {
        $dossier = DB::table('mm_mst_dossier_location')->where('id', $id)->first();
        if (!$dossier) {
            return response()->json(['success' => false, 'message' => 'Dossier non trouvé'], 404);
        }

        if ($dossier->statut !== 'diagnostic_initial') {
            return response()->json([
                'success' => false,
                'message' => 'Le diagnostic initial doit être complété avant l\'encaissement de l\'acompte.',
            ], 422);
        }

        $validated = $request->validate([
            'reference' => 'nullable|string|max:100',
            'notes'     => 'nullable|string',
        ]);

        return DB::transaction(function () use ($dossier, $id, $validated) {
            // Enregistrer le paiement MatMed
            DB::table('mm_mst_paiement_location')->insert([
                'dossier_id'    => $id,
                'type_paiement' => 'acompte',
                'montant'       => $dossier->acompte,
                'date_paiement' => now(),
                'reference'     => $validated['reference'] ?? null,
                'notes'         => $validated['notes'] ?? null,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            // Enregistrer dans la comptabilité (recettes générales)
            DB::table('gen_mst_recette')->insert([
                'source'        => 'materiel_medical',
                'source_id'     => $id,
                'reference'     => $validated['reference'] ?? null,
                'libelle'       => "Acompte location matériel — {$dossier->numero_dossier} — {$dossier->client_nom} {$dossier->client_prenom}",
                'montant'       => $dossier->acompte,
                'date_recette'  => now()->toDateString(),
                'type_paiement' => 'acompte',
                'client_nom'    => "{$dossier->client_nom} {$dossier->client_prenom}",
                'created_by'    => auth()->id(),
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            // Mettre à jour le statut et décrémenter le stock disponible
            DB::table('mm_mst_dossier_location')->where('id', $id)->update([
                'statut'     => 'en_cours',
                'updated_at' => now(),
            ]);

            // Décrémenter stock disponible et incrémenter stock en location
            $lignes = DB::table('mm_mst_location_ligne')->where('dossier_id', $id)->get();
            foreach ($lignes as $ligne) {
                DB::table('mm_mst_equipement')
                    ->where('id', $ligne->equipement_id)
                    ->decrement('stock_disponible', $ligne->quantite);
                DB::table('mm_mst_equipement')
                    ->where('id', $ligne->equipement_id)
                    ->increment('stock_en_location', $ligne->quantite);
            }

            return response()->json([
                'success' => true,
                'message' => 'Acompte encaissé. Le matériel peut maintenant être remis au client.',
                'data'    => [
                    'acompte_encaisse' => $dossier->acompte,
                    'reliquat_restant' => $dossier->reliquat,
                    'statut'           => 'en_cours',
                ],
            ]);
        });
    }

    // ── Étape 4 : Clôture du dossier (encaissement reliquat) ──────────────────
    public function cloturerDossier(Request $request, $id)
    {
        $dossier = DB::table('mm_mst_dossier_location')->where('id', $id)->first();
        if (!$dossier) {
            return response()->json(['success' => false, 'message' => 'Dossier non trouvé'], 404);
        }

        if ($dossier->statut !== 'retour_en_cours') {
            return response()->json([
                'success' => false,
                'message' => 'Le diagnostic de retour doit être complété avant la clôture.',
            ], 422);
        }

        $validated = $request->validate([
            'penalite'  => 'nullable|numeric|min:0',
            'reference' => 'nullable|string|max:100',
            'notes'     => 'nullable|string',
        ]);

        $penalite        = $validated['penalite'] ?? 0;
        $montantReliquat = $dossier->reliquat + $penalite;

        return DB::transaction(function () use ($dossier, $id, $validated, $penalite, $montantReliquat) {
            // Enregistrer le paiement du reliquat
            DB::table('mm_mst_paiement_location')->insert([
                'dossier_id'    => $id,
                'type_paiement' => 'reliquat',
                'montant'       => $dossier->reliquat,
                'date_paiement' => now(),
                'reference'     => $validated['reference'] ?? null,
                'notes'         => $validated['notes'] ?? null,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            // Enregistrer le reliquat dans la comptabilité
            DB::table('gen_mst_recette')->insert([
                'source'        => 'materiel_medical',
                'source_id'     => $id,
                'reference'     => $validated['reference'] ?? null,
                'libelle'       => "Reliquat location matériel — {$dossier->numero_dossier} — {$dossier->client_nom} {$dossier->client_prenom}",
                'montant'       => $dossier->reliquat,
                'date_recette'  => now()->toDateString(),
                'type_paiement' => 'reliquat',
                'client_nom'    => "{$dossier->client_nom} {$dossier->client_prenom}",
                'created_by'    => auth()->id(),
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            // Enregistrer la pénalité si applicable
            if ($penalite > 0) {
                DB::table('mm_mst_paiement_location')->insert([
                    'dossier_id'    => $id,
                    'type_paiement' => 'penalite',
                    'montant'       => $penalite,
                    'date_paiement' => now(),
                    'reference'     => $validated['reference'] ?? null,
                    'notes'         => 'Pénalité pour dommages constatés',
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);

                // Enregistrer la pénalité dans la comptabilité
                DB::table('gen_mst_recette')->insert([
                    'source'        => 'materiel_medical',
                    'source_id'     => $id,
                    'reference'     => $validated['reference'] ?? null,
                    'libelle'       => "Pénalité dommages — {$dossier->numero_dossier} — {$dossier->client_nom} {$dossier->client_prenom}",
                    'montant'       => $penalite,
                    'date_recette'  => now()->toDateString(),
                    'type_paiement' => 'penalite',
                    'client_nom'    => "{$dossier->client_nom} {$dossier->client_prenom}",
                    'created_by'    => auth()->id(),
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }

            // Clôturer le dossier
            DB::table('mm_mst_dossier_location')->where('id', $id)->update([
                'statut'                => 'cloture',
                'date_retour_effective' => now()->toDateString(),
                'penalite'              => $penalite,
                'updated_at'            => now(),
            ]);

            // Remettre à jour le stock
            $lignes = DB::table('mm_mst_location_ligne')->where('dossier_id', $id)->get();
            foreach ($lignes as $ligne) {
                DB::table('mm_mst_equipement')
                    ->where('id', $ligne->equipement_id)
                    ->decrement('stock_en_location', $ligne->quantite);
                DB::table('mm_mst_equipement')
                    ->where('id', $ligne->equipement_id)
                    ->increment('stock_disponible', $ligne->quantite);
            }

            return response()->json([
                'success' => true,
                'message' => 'Dossier clôturé avec succès. Matériel remis en stock.',
                'data'    => [
                    'reliquat_encaisse' => $dossier->reliquat,
                    'penalite'          => $penalite,
                    'total_encaisse'    => $montantReliquat,
                    'statut'            => 'cloture',
                ],
            ]);
        });
    }

    // ── Reporting : CA par période ─────────────────────────────────────────────
    public function reporting(Request $request)
    {
        $dateDebut = $request->input('date_debut', now()->startOfMonth()->toDateString());
        $dateFin   = $request->input('date_fin',   now()->toDateString());

        $ca = DB::table('mm_mst_paiement_location')
            ->whereDate('date_paiement', '>=', $dateDebut)
            ->whereDate('date_paiement', '<=', $dateFin)
            ->selectRaw('type_paiement, SUM(montant) as total, COUNT(*) as nb')
            ->groupBy('type_paiement')
            ->get();

        $dossiersClotures = DB::table('mm_mst_dossier_location')
            ->where('statut', 'cloture')
            ->whereDate('updated_at', '>=', $dateDebut)
            ->whereDate('updated_at', '<=', $dateFin)
            ->count();

        $dossiersEnCours = DB::table('mm_mst_dossier_location')
            ->whereIn('statut', ['en_cours', 'en_retard', 'diagnostic_initial', 'retour_en_cours'])
            ->count();

        $dossiersEnRetard = DB::table('mm_mst_dossier_location')
            ->where('statut', 'en_retard')
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'periode'           => ['debut' => $dateDebut, 'fin' => $dateFin],
                'ca_par_type'       => $ca,
                'dossiers_clotures' => $dossiersClotures,
                'dossiers_en_cours' => $dossiersEnCours,
                'dossiers_en_retard'=> $dossiersEnRetard,
            ],
        ]);
    }

    // ── Historique des locations par équipement ────────────────────────────────
    public function historiqueEquipement($equipementId)
    {
        $equipement = DB::table('mm_mst_equipement')->where('id', $equipementId)->first();
        if (!$equipement) {
            return response()->json(['success' => false, 'message' => 'Équipement non trouvé'], 404);
        }

        $historique = DB::table('mm_mst_location_ligne as l')
            ->join('mm_mst_dossier_location as d', 'l.dossier_id', '=', 'd.id')
            ->where('l.equipement_id', $equipementId)
            ->select([
                'd.numero_dossier', 'd.client_nom', 'd.client_prenom',
                'd.date_location', 'd.date_retour_prevue', 'd.date_retour_effective',
                'd.statut', 'l.quantite', 'l.prix_unitaire_location', 'l.montant_ligne',
            ])
            ->orderBy('d.date_location', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'equipement' => $equipement,
                'historique' => $historique,
            ],
        ]);
    }
}
