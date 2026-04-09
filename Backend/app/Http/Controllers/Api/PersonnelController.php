<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Personnel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PersonnelController extends Controller
{
    /**
     * Règles communes aux deux modes de création.
     */
    private function reglesRapide(): array
    {
        return [
            'first_name'            => 'required|string|max:100',
            'last_name'             => 'required|string|max:100',
            'gender_id'             => 'required|in:masculin,feminin',
            'staff_type'            => 'required|string|max:20',
            'contact_number'        => 'required|string|max:15',
            'IDgen_mst_Departement' => 'required|integer|exists:gen_mst_Departement,IDgen_mst_Departement',
        ];
    }

    /**
     * Règles supplémentaires pour la création complète.
     */
    private function reglesComplete(): array
    {
        return [
            'user_name'           => 'nullable|string|max:100',
            'email_adress'        => 'nullable|email|max:200',
            'date_of_birth'       => 'nullable|date',
            'specialization'      => 'nullable|string|max:20',
            'second_name'         => 'nullable|string|max:50',
            'nationality_id'      => 'nullable|integer',
            'address'             => 'nullable|string|max:400',
            'phone_number'        => 'nullable|string|max:50',
            'autre_adress'        => 'nullable|string|max:50',
            'email_pro'           => 'nullable|email|max:50',
            'Joining_date'        => 'nullable|date',
            'End_of_service_date' => 'nullable|date|after_or_equal:Joining_date',
            'city'                => 'nullable|string|max:50',
            'type_adresse'        => 'nullable|string|max:50',
            'code_postal'         => 'nullable|string|max:50',
            'ville_principal'     => 'nullable|string|max:50',
            'ville_secondaire'    => 'nullable|string|max:50',
            'ID_pro'              => 'nullable|string|max:50',
            'type_exercie'        => 'nullable|string|max:50',
            'secteur'             => 'nullable|string|max:50',
            'lieu_exercice'       => 'nullable|string|max:50',
            'country_id'          => 'nullable|string|max:50',
            'groupe_sanguin'      => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'personnel'           => 'nullable|boolean',
            'consult'             => 'nullable|boolean',
            'titre_id'            => 'nullable|string|max:50',
            'status_id'           => 'nullable|integer',
        ];
    }

    /**
     * Liste du personnel avec filtres optionnels.
     *
     * GET /api/v1/personnels
     * Paramètres de filtre : IDgen_mst_Departement, staff_type, status_id, gender_id
     */
    public function index(Request $request): JsonResponse
    {
        $query = Personnel::with('departement');

        if ($request->filled('IDgen_mst_Departement')) {
            $query->where('IDgen_mst_Departement', $request->IDgen_mst_Departement);
        }
        if ($request->filled('staff_type')) {
            $query->where('staff_type', $request->staff_type);
        }
        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        }
        if ($request->filled('gender_id')) {
            $query->where('gender_id', $request->gender_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('staff_name', 'ilike', "%{$search}%")
                  ->orWhere('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('user_id', 'ilike', "%{$search}%");
            });
        }

        $personnels = $query->orderBy('staff_name')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $personnels,
            'meta'    => [
                'labels'          => Personnel::labels(),
                'genres'          => Personnel::GENRES,
                'types_personnel' => Personnel::TYPES_PERSONNEL,
                'groupes_sanguins' => Personnel::GROUPES_SANGUINS,
            ],
        ]);
    }

    /**
     * Création rapide du personnel (champs essentiels uniquement).
     *
     * POST /api/v1/personnels/creation-rapide
     */
    public function storeRapide(Request $request): JsonResponse
    {
        $validated = $request->validate($this->reglesRapide());

        $validated['staff_name']      = trim($validated['first_name'] . ' ' . $validated['last_name']);
        $validated['user_id']         = $this->genererUserId();
        $validated['created_user_id'] = auth()->id() ?? 'system';
        $validated['created_dttm']    = now();
        $validated['status_id']       = 1;

        $personnel = Personnel::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Personnel créé rapidement. Vous pouvez compléter son dossier ultérieurement.',
            'data'    => $personnel->load('departement'),
            'profil_complet' => false,
        ], 201);
    }

    /**
     * Création complète du personnel (tous les champs).
     *
     * POST /api/v1/personnels
     */
    public function store(Request $request): JsonResponse
    {
        $regles = array_merge($this->reglesRapide(), $this->reglesComplete());
        $validated = $request->validate($regles);

        $validated['staff_name']      = trim(($validated['first_name'] ?? '') . ' ' . ($validated['last_name'] ?? ''));
        $validated['user_id']         = $this->genererUserId();
        $validated['created_user_id'] = auth()->id() ?? 'system';
        $validated['created_dttm']    = now();

        if (!isset($validated['status_id'])) {
            $validated['status_id'] = 1;
        }

        $personnel = Personnel::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dossier personnel créé avec succès.',
            'data'    => $personnel->load('departement'),
            'profil_complet' => true,
        ], 201);
    }

    /**
     * Afficher un membre du personnel avec toutes ses informations.
     *
     * GET /api/v1/personnels/{id}
     */
    public function show(Personnel $personnel): JsonResponse
    {
        $personnel->load('departement.hospital');

        return response()->json([
            'success' => true,
            'data'    => $personnel,
            'meta'    => [
                'labels'          => Personnel::labels(),
                'genres'          => Personnel::GENRES,
                'types_personnel' => Personnel::TYPES_PERSONNEL,
                'groupes_sanguins' => Personnel::GROUPES_SANGUINS,
            ],
        ]);
    }

    /**
     * Compléter ou modifier le dossier d'un personnel.
     *
     * PUT /api/v1/personnels/{id}
     */
    public function update(Request $request, Personnel $personnel): JsonResponse
    {
        $regles = array_merge(
            array_map(fn($r) => str_replace('required|', 'sometimes|required|', $r), $this->reglesRapide()),
            $this->reglesComplete()
        );

        $validated = $request->validate($regles);

        if (isset($validated['first_name']) || isset($validated['last_name'])) {
            $prenom = $validated['first_name'] ?? $personnel->first_name;
            $nom    = $validated['last_name']  ?? $personnel->last_name;
            $validated['staff_name'] = trim($prenom . ' ' . $nom);
        }

        $validated['modified_dttm'] = now();

        $personnel->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dossier personnel mis à jour avec succès.',
            'data'    => $personnel->fresh()->load('departement'),
        ]);
    }

    /**
     * Supprimer un membre du personnel.
     *
     * DELETE /api/v1/personnels/{id}
     */
    public function destroy(Personnel $personnel): JsonResponse
    {
        $personnel->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dossier personnel supprimé avec succès.',
        ]);
    }

    /**
     * Retourner les métadonnées pour les formulaires (listes de choix, labels).
     *
     * GET /api/v1/personnels/metadata
     */
    public function metadata(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'labels'           => Personnel::labels(),
                'genres'           => Personnel::GENRES,
                'types_personnel'  => Personnel::TYPES_PERSONNEL,
                'groupes_sanguins' => Personnel::GROUPES_SANGUINS,
                'champs_rapide'    => [
                    'first_name', 'last_name', 'gender_id',
                    'staff_type', 'contact_number', 'IDgen_mst_Departement',
                ],
                'champs_complets'  => array_keys(Personnel::labels()),
            ],
        ]);
    }

    /**
     * Générer un identifiant unique pour le personnel.
     */
    private function genererUserId(): string
    {
        do {
            $id = 'USR' . strtoupper(Str::random(7));
        } while (Personnel::where('user_id', $id)->exists());

        return $id;
    }
}
