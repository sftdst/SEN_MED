<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PartenaireHeader;
use App\Models\PartenaireDtl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PartenaireController extends Controller
{
    // ═══════════════════════════════════════════════════════
    // PARTENAIRE HEADER
    // ═══════════════════════════════════════════════════════

    public function index(Request $request): JsonResponse
    {
        $query = PartenaireHeader::withCount('typesCouverture')
                                  ->withSum('typesCouverture', 'Maximum_Credit');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('Nom', 'ilike', "%{$s}%")
                  ->orWhere('id_gen_partenaire', 'ilike', "%{$s}%")
                  ->orWhere('code_societe', 'ilike', "%{$s}%");
            });
        }

        if ($request->filled('TypePart')) {
            $query->where('TypePart', $request->TypePart);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('Nom')->paginate($request->get('per_page', 15)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'Nom'            => 'required|string|max:50',
            'pays'           => 'nullable|string|max:50',
            'ville'          => 'nullable|string|max:50',
            'adress'         => 'nullable|string|max:50',
            'contact'        => 'nullable|string|max:50',
            'mobile'         => 'nullable|string|max:50',
            'bank'           => 'nullable|string|max:50',
            'email'          => 'nullable|email|max:50',
            'type_societe'   => 'nullable|string|max:50',
            'numero_compte'  => 'nullable|string|max:50',
            'maximum_credit' => 'nullable|integer|min:0',
            'date_created'   => 'nullable|date',
            'code_societe'   => 'nullable|string|max:50|unique:gen_mst_partenaire_header,code_societe',
            'status'         => 'nullable|boolean',
            'TypePart'       => 'nullable|integer|in:0,1,2,3,4',
        ]);

        $validated['id_gen_partenaire'] = $this->genererIdPartenaire();
        $validated['date_created']      = $validated['date_created'] ?? now()->toDateString();

        $partenaire = PartenaireHeader::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Partenaire créé avec succès.',
            'data'    => $partenaire->loadCount('typesCouverture'),
        ], 201);
    }

    public function show(PartenaireHeader $partenaire): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $partenaire->load('typesCouverture'),
        ]);
    }

    public function update(Request $request, PartenaireHeader $partenaire): JsonResponse
    {
        $validated = $request->validate([
            'Nom'            => 'sometimes|string|max:50',
            'pays'           => 'nullable|string|max:50',
            'ville'          => 'nullable|string|max:50',
            'adress'         => 'nullable|string|max:50',
            'contact'        => 'nullable|string|max:50',
            'mobile'         => 'nullable|string|max:50',
            'bank'           => 'nullable|string|max:50',
            'email'          => 'nullable|email|max:50',
            'type_societe'   => 'nullable|string|max:50',
            'numero_compte'  => 'nullable|string|max:50',
            'maximum_credit' => 'nullable|integer|min:0',
            'date_created'   => 'nullable|date',
            'code_societe'   => 'nullable|string|max:50|unique:gen_mst_partenaire_header,code_societe,' . $partenaire->id_Rep . ',id_Rep',
            'status'         => 'nullable|boolean',
            'TypePart'       => 'nullable|integer|in:0,1,2,3,4',
        ]);

        // ── Règle métier : le nouveau maximum_credit ne peut pas être
        //    inférieur à la somme déjà allouée aux couvertures existantes
        if (isset($validated['maximum_credit'])) {
            $dejaAlloue = $partenaire->typesCouverture()->sum('Maximum_Credit');
            if ($validated['maximum_credit'] < $dejaAlloue) {
                return response()->json([
                    'success' => false,
                    'message' => "Le Maximum Crédit ({$this->fmt($validated['maximum_credit'])} FCFA) est inférieur au montant déjà alloué aux types de couverture ({$this->fmt($dejaAlloue)} FCFA). Réduisez d'abord les couvertures.",
                    'errors'  => ['maximum_credit' => ["Valeur minimum : {$this->fmt($dejaAlloue)} FCFA"]],
                ], 422);
            }
        }

        $partenaire->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Partenaire mis à jour.',
            'data'    => $partenaire->fresh()->loadCount('typesCouverture')->loadSum('typesCouverture', 'Maximum_Credit'),
        ]);
    }

    public function destroy(PartenaireHeader $partenaire): JsonResponse
    {
        $partenaire->delete();

        return response()->json([
            'success' => true,
            'message' => 'Partenaire supprimé.',
        ]);
    }

    // ═══════════════════════════════════════════════════════
    // TYPES DE COUVERTURE
    // ═══════════════════════════════════════════════════════

    public function couvertures(PartenaireHeader $partenaire): JsonResponse
    {
        $couvertures = $partenaire->typesCouverture()->orderBy('id_Rep')->get();
        $totalAlloue = $couvertures->sum('Maximum_Credit');

        return response()->json([
            'success'       => true,
            'data'          => $couvertures,
            'total_alloue'  => $totalAlloue,
            'maximum_credit'=> $partenaire->maximum_credit,
            'solde_disponible' => max(0, $partenaire->maximum_credit - $totalAlloue),
        ]);
    }

    public function ajouterCouverture(Request $request, PartenaireHeader $partenaire): JsonResponse
    {
        $validated = $request->validate([
            'Nom'                  => 'required|string|max:50',
            'service'              => 'nullable|string|max:50',
            'contributionCompagny' => 'required|integer|min:0|max:100',
            'contributionPatient'  => 'required|integer|min:0|max:100',
            'Maximum_Credit'       => 'nullable|integer|min:0',
        ]);

        // Règle 1 : Part Compagnie + Part Patient = 100 %
        $totalPct = $validated['contributionCompagny'] + $validated['contributionPatient'];
        if ($totalPct !== 100) {
            return response()->json([
                'success' => false,
                'message' => "Part Compagnie ({$validated['contributionCompagny']}%) + Part Patient ({$validated['contributionPatient']}%) doit être égale à 100%.",
            ], 422);
        }

        // Règle 2 : somme des Maximum_Credit ne dépasse pas le plafond du partenaire
        $dejaAlloue  = $partenaire->typesCouverture()->sum('Maximum_Credit');
        $nouveau     = (int) ($validated['Maximum_Credit'] ?? 0);
        $apresAjout  = $dejaAlloue + $nouveau;

        if ($partenaire->maximum_credit > 0 && $apresAjout > $partenaire->maximum_credit) {
            $disponible = max(0, $partenaire->maximum_credit - $dejaAlloue);
            return response()->json([
                'success' => false,
                'message' => "Dépassement du plafond du partenaire. Montant disponible : {$this->fmt($disponible)} FCFA (plafond : {$this->fmt($partenaire->maximum_credit)} FCFA, déjà alloué : {$this->fmt($dejaAlloue)} FCFA).",
                'errors'  => ['Maximum_Credit' => ["Maximum autorisé : {$this->fmt($disponible)} FCFA"]],
            ], 422);
        }

        $validated['Id_gen_partenaire'] = $partenaire->id_gen_partenaire;
        $validated['id_partenaire_dtl'] = $this->genererIdDtl();

        $couverture = PartenaireDtl::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Type de couverture ajouté.',
            'data'    => $couverture,
        ], 201);
    }

    public function modifierCouverture(Request $request, PartenaireHeader $partenaire, PartenaireDtl $couverture): JsonResponse
    {
        $validated = $request->validate([
            'Nom'                  => 'sometimes|string|max:50',
            'service'              => 'nullable|string|max:50',
            'contributionCompagny' => 'sometimes|integer|min:0|max:100',
            'contributionPatient'  => 'sometimes|integer|min:0|max:100',
            'Maximum_Credit'       => 'nullable|integer|min:0',
        ]);

        // Règle 1 : somme des parts = 100 %
        $compagnie = $validated['contributionCompagny'] ?? $couverture->contributionCompagny;
        $patient   = $validated['contributionPatient']  ?? $couverture->contributionPatient;

        if (($compagnie + $patient) !== 100) {
            return response()->json([
                'success' => false,
                'message' => "Part Compagnie ({$compagnie}%) + Part Patient ({$patient}%) doit être égale à 100%.",
            ], 422);
        }

        // Règle 2 : plafond total couvertures
        if (isset($validated['Maximum_Credit'])) {
            $autresCouvertures = $partenaire->typesCouverture()
                ->where('id_Rep', '!=', $couverture->id_Rep)
                ->sum('Maximum_Credit');
            $apresModif = $autresCouvertures + (int) $validated['Maximum_Credit'];

            if ($partenaire->maximum_credit > 0 && $apresModif > $partenaire->maximum_credit) {
                $disponible = max(0, $partenaire->maximum_credit - $autresCouvertures);
                return response()->json([
                    'success' => false,
                    'message' => "Dépassement du plafond. Maximum autorisé pour cette couverture : {$this->fmt($disponible)} FCFA.",
                    'errors'  => ['Maximum_Credit' => ["Maximum autorisé : {$this->fmt($disponible)} FCFA"]],
                ], 422);
            }
        }

        $couverture->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Type de couverture mis à jour.',
            'data'    => $couverture->fresh(),
        ]);
    }

    public function supprimerCouverture(PartenaireHeader $partenaire, PartenaireDtl $couverture): JsonResponse
    {
        $couverture->delete();

        return response()->json([
            'success' => true,
            'message' => 'Type de couverture supprimé.',
        ]);
    }

    // ═══════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════

    private function genererIdPartenaire(): string
    {
        do { $id = 'PART-' . strtoupper(Str::random(6)); }
        while (PartenaireHeader::where('id_gen_partenaire', $id)->exists());
        return $id;
    }

    private function genererIdDtl(): string
    {
        do { $id = 'COV-' . strtoupper(Str::random(7)); }
        while (PartenaireDtl::where('id_partenaire_dtl', $id)->exists());
        return $id;
    }

    private function fmt(int $val): string
    {
        return number_format($val, 0, ',', ' ');
    }
}
