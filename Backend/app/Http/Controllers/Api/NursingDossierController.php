<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NursingAssessment;
use App\Models\NursingCareRecord;
use App\Models\NursingContact;
use App\Models\NursingDossier;
use App\Models\NursingIntervenant;
use App\Models\NursingTransmission;
use App\Models\NursingTreatment;
use App\Models\NursingSurveillance;
use App\Models\VisiteAdt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NursingDossierController extends Controller
{
    // ── DOSSIERS ──────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/nursing-dossiers
     * Filtres : patient_id, statut, date_debut, search (nom patient)
     */
    public function index(Request $request): JsonResponse
    {
        $query = NursingDossier::query()
            ->with([
                'patient:patient_id,first_name,last_name,patient_code,patient_name',
                'visite:adt_id,visit_datetime,IDgen_mst_Departement',
            ])
            ->withCount(['contacts', 'intervenants']);

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('date_debut')) {
            $query->whereDate('date_debut', '>=', $request->date_debut);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('patient_code', 'ilike', "%{$search}%")
                  ->orWhere('patient_name', 'ilike', "%{$search}%");
            });
        }

        $dossiers = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data'    => $dossiers,
            'message' => 'Dossiers récupérés avec succès.',
        ]);
    }

    /**
     * POST /api/v1/nursing-dossiers
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id'  => 'required|string|exists:gen_mst_patient,patient_id',
            'adt_id'      => 'nullable|integer|exists:clinic_txn_adt,adt_id',
            'hospital_id' => 'nullable|integer',
            'date_debut'  => 'required|date',
            'date_fin'    => 'nullable|date|after_or_equal:date_debut',
            'statut'      => 'nullable|string|in:en_cours,termine',
            'notes'       => 'nullable|string',
            'created_by'  => 'nullable|integer',
        ], [
            'patient_id.exists'   => 'Patient introuvable dans la base de données.',
            'patient_id.required' => 'Le patient est obligatoire.',
            'date_debut.required' => 'La date de début est obligatoire.',
        ]);

        try {
            // Vérifier l'existence de la visite si fournie
            if (!empty($validated['adt_id'])) {
                $exists = VisiteAdt::where('adt_id', $validated['adt_id'])->exists();
                if (!$exists) {
                    return response()->json([
                        'message' => "La visite (adt_id={$validated['adt_id']}) n'existe pas.",
                    ], 422);
                }
            }

            $validated['statut'] = $validated['statut'] ?? 'en_cours';

            $dossier = NursingDossier::create($validated);
            $dossier->load([
                'patient:patient_id,first_name,last_name,patient_code,patient_name',
                'visite:adt_id,visit_datetime,IDgen_mst_Departement',
                'contacts',
                'intervenants',
            ]);

            return response()->json([
                'data'    => $dossier,
                'message' => 'Dossier de soins infirmiers créé avec succès.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du dossier.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/nursing-dossiers/{dossier}
     */
    public function show(int $dossier): JsonResponse
    {
        $data = NursingDossier::with([
            'patient:patient_id,first_name,second_name,last_name,patient_code,patient_name,dob,contact_number,mobile_number,address,address2,city,ssn_no,gender_id,marital_name,nationality_id,profession,emergency_contact_name,emergency_contact_number',
            'visite:adt_id,visit_datetime,IDgen_mst_Departement',
            'contacts',
            'intervenants',
            'treatments',
            'careRecords',
            'transmissions',
            'assessments',
            'surveillances',
        ])->findOrFail($dossier);

        return response()->json([
            'data'    => $data,
            'message' => 'Dossier récupéré avec succès.',
        ]);
    }

    /**
     * PUT /api/v1/nursing-dossiers/{dossier}
     */
    public function update(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $validated = $request->validate([
            'date_fin'    => 'nullable|date',
            'statut'      => 'nullable|string|in:en_cours,termine',
            'notes'       => 'nullable|string',
            'hospital_id' => 'nullable|integer',
            'date_debut'  => 'nullable|date',
        ]);

        try {
            $record->update($validated);
            $record->load([
                'patient:patient_id,first_name,last_name,patient_code,patient_name',
                'visite:adt_id,visit_datetime,IDgen_mst_Departement',
            ]);

            return response()->json([
                'data'    => $record,
                'message' => 'Dossier mis à jour avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du dossier.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/nursing-dossiers/{dossier}
     */
    public function destroy(int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        try {
            $record->delete();

            return response()->json([
                'message' => 'Dossier supprimé avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du dossier.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ── CONTACTS ──────────────────────────────────────────────────────────────

    /**
     * PUT /api/v1/nursing-dossiers/{dossier}/contacts
     * Sync complet (supprime + recrée)
     */
    public function updateContacts(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $validated = $request->validate([
            'contacts'            => 'required|array',
            'contacts.*.nom'      => 'required|string|max:255',
            'contacts.*.qualite'  => 'nullable|string|max:255',
            'contacts.*.telephone'=> 'nullable|string|max:50',
            'contacts.*.ordre'    => 'nullable|integer|in:1,2',
        ]);

        try {
            DB::transaction(function () use ($record, $validated) {
                $record->contacts()->delete();

                foreach ($validated['contacts'] as $contactData) {
                    $contactData['dossier_id'] = $record->id;
                    $contactData['ordre']      = $contactData['ordre'] ?? 1;
                    NursingContact::create($contactData);
                }
            });

            $contacts = $record->contacts()->get();

            return response()->json([
                'data'    => $contacts,
                'message' => 'Contacts mis à jour avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour des contacts.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ── INTERVENANTS ──────────────────────────────────────────────────────────

    /**
     * PUT /api/v1/nursing-dossiers/{dossier}/intervenants
     * Sync complet (supprime + recrée)
     */
    public function updateIntervenants(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $validated = $request->validate([
            'intervenants'                      => 'required|array',
            'intervenants.*.type_intervenant'   => 'required|string',
            'intervenants.*.nom'                => 'nullable|string|max:255',
            'intervenants.*.telephone'          => 'nullable|string|max:50',
            'intervenants.*.cabinet'            => 'nullable|string|max:255',
        ]);

        try {
            DB::transaction(function () use ($record, $validated) {
                $record->intervenants()->delete();

                foreach ($validated['intervenants'] as $data) {
                    $data['dossier_id'] = $record->id;
                    NursingIntervenant::create($data);
                }
            });

            $intervenants = $record->intervenants()->get();

            return response()->json([
                'data'    => $intervenants,
                'message' => 'Intervenants mis à jour avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour des intervenants.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ── TRAITEMENTS ───────────────────────────────────────────────────────────

    /**
     * POST /api/v1/nursing-dossiers/{dossier}/treatments
     */
    public function storeTreatment(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $validated = $request->validate([
            'designation' => 'required|string|max:255',
            'date_debut'  => 'nullable|date',
            'date_fin'    => 'nullable|date|after_or_equal:date_debut',
            'arret'       => 'nullable|boolean',
            'matin'       => 'nullable|boolean',
            'midi'        => 'nullable|boolean',
            'soir'        => 'nullable|boolean',
            'nuit'        => 'nullable|boolean',
            'ordre'       => 'nullable|integer',
        ]);

        try {
            $validated['dossier_id'] = $record->id;
            $treatment = NursingTreatment::create($validated);

            return response()->json([
                'data'    => $treatment,
                'message' => 'Traitement ajouté avec succès.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'ajout du traitement.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/v1/nursing-dossiers/{dossier}/treatments/{treatment}
     */
    public function updateTreatment(Request $request, int $dossier, int $treatmentId): JsonResponse
    {
        $record    = NursingDossier::findOrFail($dossier);
        $treatment = NursingTreatment::where('dossier_id', $record->id)
                                     ->findOrFail($treatmentId);

        $validated = $request->validate([
            'designation' => 'nullable|string|max:255',
            'date_debut'  => 'nullable|date',
            'date_fin'    => 'nullable|date',
            'arret'       => 'nullable|boolean',
            'matin'       => 'nullable|boolean',
            'midi'        => 'nullable|boolean',
            'soir'        => 'nullable|boolean',
            'nuit'        => 'nullable|boolean',
            'ordre'       => 'nullable|integer',
        ]);

        try {
            $treatment->update($validated);

            return response()->json([
                'data'    => $treatment->fresh(),
                'message' => 'Traitement mis à jour avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du traitement.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/nursing-dossiers/{dossier}/treatments/{treatment}
     */
    public function destroyTreatment(int $dossier, int $treatmentId): JsonResponse
    {
        $record    = NursingDossier::findOrFail($dossier);
        $treatment = NursingTreatment::where('dossier_id', $record->id)
                                     ->findOrFail($treatmentId);

        try {
            $treatment->delete();

            return response()->json([
                'message' => 'Traitement supprimé avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du traitement.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ── SOINS (DIAGRAMME) ─────────────────────────────────────────────────────

    /**
     * POST /api/v1/nursing-dossiers/{dossier}/care-records
     * Upsert par dossier_id + date_soin + soin_label + periode
     */
    public function storeCareRecord(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $validated = $request->validate([
            'date_soin'     => 'required|date',
            'soin_category' => 'required|string|in:role_propre,prescription',
            'soin_label'    => 'required|string|max:255',
            'periode'       => 'required|string',
            'realise'       => 'nullable|boolean',
            'note'          => 'nullable|string',
            'infirmiere_id' => 'nullable|integer',
        ]);

        try {
            $careRecord = NursingCareRecord::updateOrCreate(
                [
                    'dossier_id' => $record->id,
                    'date_soin'  => $validated['date_soin'],
                    'soin_label' => $validated['soin_label'],
                    'periode'    => $validated['periode'],
                ],
                [
                    'soin_category' => $validated['soin_category'],
                    'realise'       => $validated['realise'] ?? false,
                    'note'          => $validated['note'] ?? null,
                    'infirmiere_id' => $validated['infirmiere_id'] ?? null,
                ]
            );

            return response()->json([
                'data'    => $careRecord,
                'message' => 'Soin enregistré avec succès.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement du soin.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/nursing-dossiers/{dossier}/care-diagram
     * Paramètres : date_debut, date_fin
     */
    public function getCareDiagram(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $request->validate([
            'date_debut' => 'nullable|date',
            'date_fin'   => 'nullable|date',
        ]);

        $query = NursingCareRecord::where('dossier_id', $record->id);

        if ($request->filled('date_debut')) {
            $query->whereDate('date_soin', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('date_soin', '<=', $request->date_fin);
        }

        $records = $query->orderBy('date_soin')->orderBy('soin_label')->get();

        // Grouper par date puis par soin_label
        $grouped = $records->groupBy(function ($item) {
            return $item->date_soin->format('Y-m-d');
        })->map(function ($dayRecords) {
            return $dayRecords->groupBy('soin_label');
        });

        return response()->json([
            'data'    => $grouped,
            'message' => 'Diagramme de soins récupéré avec succès.',
        ]);
    }

    // ── TRANSMISSIONS ─────────────────────────────────────────────────────────

    /**
     * POST /api/v1/nursing-dossiers/{dossier}/transmissions
     */
    public function storeTransmission(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $validated = $request->validate([
            'type_transmission' => 'required|string|in:observation,dar',
            'date_transmission' => 'required|date',
            'cible'             => 'nullable|string|max:255',
            'dar_category'      => 'nullable|string|in:D,A,R',
            'contenu'           => 'required|string',
            'infirmiere_id'     => 'nullable|integer',
        ]);

        try {
            $validated['dossier_id'] = $record->id;
            $transmission = NursingTransmission::create($validated);

            return response()->json([
                'data'    => $transmission,
                'message' => 'Transmission créée avec succès.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la transmission.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/nursing-dossiers/{dossier}/transmissions/{transmission}
     */
    public function destroyTransmission(int $dossier, int $transmissionId): JsonResponse
    {
        $record       = NursingDossier::findOrFail($dossier);
        $transmission = NursingTransmission::where('dossier_id', $record->id)
                                           ->findOrFail($transmissionId);

        try {
            $transmission->delete();

            return response()->json([
                'message' => 'Transmission supprimée avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la transmission.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ── ÉVALUATIONS ───────────────────────────────────────────────────────────

    /**
     * POST /api/v1/nursing-dossiers/{dossier}/assessments
     */
    public function storeAssessment(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $validated = $request->validate([
            'type_echelle'    => 'required|string|in:chute,doloplus,norton,mna',
            'date_evaluation' => 'required|date',
            'reponses'        => 'required|array',
            'score'           => 'required|numeric|min:0',
            'score_max'       => 'required|numeric|min:0',
            'infirmiere_id'   => 'nullable|integer',
        ]);

        try {
            $score         = (float) $validated['score'];
            $interpretation = $this->calculerInterpretation($validated['type_echelle'], $score);

            $validated['dossier_id']     = $record->id;
            $validated['interpretation'] = $interpretation;

            $assessment = NursingAssessment::create($validated);

            return response()->json([
                'data'    => $assessment,
                'message' => 'Évaluation créée avec succès.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de l\'évaluation.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/nursing-dossiers/{dossier}/assessments
     * Retourne les évaluations groupées par type_echelle
     */
    public function getAssessments(int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $assessments = NursingAssessment::where('dossier_id', $record->id)
                                        ->orderBy('date_evaluation', 'desc')
                                        ->get()
                                        ->groupBy('type_echelle');

        return response()->json([
            'data'    => $assessments,
            'message' => 'Évaluations récupérées avec succès.',
        ]);
    }

    // ── SURVEILLANCES ─────────────────────────────────────────────────────────

    /**
     * POST /api/v1/nursing-dossiers/{dossier}/surveillances
     */
    public function storeSurveillance(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $validated = $request->validate([
            'type_surveillance' => 'required|string|in:plaie,diabete',
            'date_surveillance' => 'required|date',
            'data'              => 'required|array',
            'observations'      => 'nullable|string',
            'infirmiere_id'     => 'nullable|integer',
        ]);

        try {
            $validated['dossier_id'] = $record->id;
            $surveillance = NursingSurveillance::create($validated);

            return response()->json([
                'data'    => $surveillance,
                'message' => 'Surveillance créée avec succès.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la surveillance.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/nursing-dossiers/{dossier}/surveillances
     * Paramètre facultatif : type (plaie|diabete)
     */
    public function getSurveillances(Request $request, int $dossier): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);

        $query = NursingSurveillance::where('dossier_id', $record->id);

        if ($request->filled('type')) {
            $query->where('type_surveillance', $request->type);
        }

        $surveillances = $query->orderBy('date_surveillance', 'desc')->get();

        return response()->json([
            'data'    => $surveillances,
            'message' => 'Surveillances récupérées avec succès.',
        ]);
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/nursing-dossiers/dashboard
     */
    public function dashboard(): JsonResponse
    {
        $nbEnCours   = NursingDossier::where('statut', 'en_cours')->count();
        $nbTermines  = NursingDossier::where('statut', 'termine')->count();
        $nbTotal     = NursingDossier::count();

        $derniersDossiers = NursingDossier::with([
            'patient:patient_id,first_name,last_name,patient_code,patient_name',
        ])
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get();

        return response()->json([
            'data' => [
                'nb_dossiers_en_cours'  => $nbEnCours,
                'nb_dossiers_termines'  => $nbTermines,
                'nb_dossiers_total'     => $nbTotal,
                'derniers_dossiers'     => $derniersDossiers,
            ],
            'message' => 'Tableau de bord récupéré avec succès.',
        ]);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /**
     * Calcule l'interprétation selon le type d'échelle et le score.
     */
    private function calculerInterpretation(string $typeEchelle, float $score): string
    {
        return match ($typeEchelle) {
            'chute'    => $this->interpretationChute($score),
            'doloplus' => $this->interpretationDoloplus($score),
            'norton'   => $this->interpretationNorton($score),
            'mna'      => $this->interpretationMna($score),
            default    => '',
        };
    }

    private function interpretationChute(float $score): string
    {
        if ($score < 8)  return 'Peu de risques';
        if ($score <= 16) return 'Risque important';
        return 'Risque majeur';
    }

    private function interpretationDoloplus(float $score): string
    {
        if ($score < 10)  return 'Douleur absente';
        if ($score <= 20) return 'Douleur modérée';
        return 'Douleur intense';
    }

    private function interpretationNorton(float $score): string
    {
        return $score > 14 ? 'Sans risque' : "Risque d'escarres";
    }

    private function interpretationMna(float $score): string
    {
        if ($score >= 24)   return 'État satisfaisant';
        if ($score >= 17)   return 'Risque de malnutrition';
        return 'Mauvais état nutritionnel';
    }
}
