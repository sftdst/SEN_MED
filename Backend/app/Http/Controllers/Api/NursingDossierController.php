<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillHeader;
use App\Models\Facture;
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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            'designation'   => 'required|string|max:255',
            'item_id'       => 'nullable|string|max:50',
            'item_ref'      => 'nullable|string|max:20',
            'quantite'      => 'nullable|integer|min:1',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'posologie'     => 'nullable|string|max:200',
            'date_debut'    => 'nullable|date',
            'date_fin'      => 'nullable|date|after_or_equal:date_debut',
            'arret'         => 'nullable|boolean',
            'matin'         => 'nullable|boolean',
            'midi'          => 'nullable|boolean',
            'soir'          => 'nullable|boolean',
            'nuit'          => 'nullable|boolean',
            'ordre'         => 'nullable|integer',
        ]);

        try {
            $validated['dossier_id'] = $record->id;
            $quantite      = max(1, (int) ($validated['quantite'] ?? 1));
            $prixUnitaire  = (float) ($validated['prix_unitaire'] ?? 0);
            $validated['quantite']      = $quantite;
            $validated['prix_unitaire'] = $prixUnitaire;
            $validated['prix_total']    = round($prixUnitaire * $quantite, 2);

            $treatment = NursingTreatment::create($validated);

            // ── Créer la ligne facture si prix > 0 ──────────────────────────
            if ($prixUnitaire > 0) {
                $facId = $this->ajouterLigneFactureNursing(
                    $record,
                    $validated['designation'],
                    $validated['prix_total'],
                    'SOIN_INF',
                    $treatment->id
                );
                if ($facId) {
                    $treatment->update(['facturation_id' => $facId]);
                }
            }

            return response()->json([
                'data'    => $treatment->fresh(),
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
            'designation'   => 'nullable|string|max:255',
            'item_id'       => 'nullable|string|max:50',
            'item_ref'      => 'nullable|string|max:20',
            'quantite'      => 'nullable|integer|min:1',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'posologie'     => 'nullable|string|max:200',
            'date_debut'    => 'nullable|date',
            'date_fin'      => 'nullable|date',
            'arret'         => 'nullable|boolean',
            'matin'         => 'nullable|boolean',
            'midi'          => 'nullable|boolean',
            'soir'          => 'nullable|boolean',
            'nuit'          => 'nullable|boolean',
            'ordre'         => 'nullable|integer',
        ]);

        try {
            // Recalculer prix_total si quantite ou prix_unitaire changent
            $quantite     = (int) ($validated['quantite']      ?? $treatment->quantite      ?? 1);
            $prixUnit     = (float) ($validated['prix_unitaire'] ?? $treatment->prix_unitaire ?? 0);
            $validated['prix_total'] = round($prixUnit * max(1, $quantite), 2);

            // Si la ligne facture existait et que le prix change, mettre à jour
            if ($treatment->facturation_id && $validated['prix_total'] != (float) $treatment->prix_total) {
                $this->mettreAJourLigneFactureNursing($treatment->facturation_id, $record, $validated['prix_total']);
            }
            // Si pas de facture encore et prix > 0 maintenant
            if (!$treatment->facturation_id && $prixUnit > 0) {
                $label = $validated['designation'] ?? $treatment->designation;
                $facId = $this->ajouterLigneFactureNursing($record, $label, $validated['prix_total'], 'SOIN_INF', $treatment->id);
                if ($facId) $validated['facturation_id'] = $facId;
            }

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
            // Annuler la ligne facture associée si elle existe
            if ($treatment->facturation_id) {
                $this->supprimerLigneFactureNursing($treatment->facturation_id, $record);
            }

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

    // ── Helpers facturation soins infirmiers ───────────────────────────────────

    /**
     * Crée une ligne gen_mst_facture pour un soin infirmier.
     * Retourne l'ID de la ligne créée ou null si échec.
     */
    private function ajouterLigneFactureNursing(
        NursingDossier $dossier,
        string         $description,
        float          $montant,
        string         $typeService,
        int            $procedureId
    ): ?int {
        try {
            // Récupérer la visite si dossier lié à un adt_id
            $visite  = $dossier->adt_id ? VisiteAdt::find($dossier->adt_id) : null;
            $billHd  = $visite ? BillHeader::where('adt_id', $visite->adt_id)->first() : null;

            // Calcul part patient / compagnie
            $pctCie      = 0;
            if ($visite) {
                $totalVisite = (float) ($visite->Total_a_payer ?? 0);
                $pctCie      = $totalVisite > 0 ? ((float) ($visite->montant_compagny ?? 0) / $totalVisite) : 0;
            }
            $partCie      = round($montant * $pctCie, 3);
            $partPatient  = round($montant - $partCie, 3);

            $facture = Facture::create([
                'NomDescription'         => $description,
                'PrixService'            => $montant,
                'IDService'              => null,
                'adt_id'                 => $dossier->adt_id,
                'patient_id'             => $dossier->patient_id,
                'MontantPayer'           => 0,
                'MontantRestant'         => $partPatient,
                'compagny_id'            => $visite?->ID_Compagny,
                'MontantTotalFacture'    => $montant,
                'StatutPaiement'         => 'EN_ATTENTE',
                'DateCreation'           => now(),
                'docteur_id'             => null,
                'MontantPartenaire'      => $partCie,
                'TypeService'            => $typeService,
                'patient_payable'        => $partPatient,
                'bill_id'                => $billHd?->bill_hd_id,
                'ID_Procedure'           => $procedureId,
                'MontantpayerPartenaire' => 0,
            ]);

            // Mettre à jour les totaux BillHeader et VisiteAdt si liés
            if ($billHd) {
                $billHd->increment('bill_amount',    $montant);
                $billHd->increment('net_amount',     $montant);
                $billHd->increment('pending_amount', $partPatient);
            }
            if ($visite) {
                $visite->increment('bill_amount',     $montant);
                $visite->increment('Total_a_payer',   $montant);
                $visite->increment('montant_patient',  $partPatient);
                $visite->increment('montant_compagny', $partCie);
            }

            return $facture->IDgen_mst_facture;
        } catch (\Exception $e) {
            \Log::error("ajouterLigneFactureNursing: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Met à jour le montant d'une ligne facture existante (ajustement delta).
     */
    private function mettreAJourLigneFactureNursing(int $facId, NursingDossier $dossier, float $newMontant): void
    {
        try {
            $facture = Facture::find($facId);
            if (!$facture) return;

            $ancienMontant = (float) $facture->MontantTotalFacture;
            $delta         = $newMontant - $ancienMontant;

            $facture->update([
                'PrixService'         => $newMontant,
                'MontantTotalFacture' => $newMontant,
                'MontantRestant'      => $newMontant,
                'patient_payable'     => $newMontant,
            ]);

            // Ajuster BillHeader
            if ($dossier->adt_id) {
                $billHd = BillHeader::where('adt_id', $dossier->adt_id)->first();
                if ($billHd && $delta != 0) {
                    $billHd->increment('bill_amount',    $delta);
                    $billHd->increment('net_amount',     $delta);
                    $billHd->increment('pending_amount', $delta);
                }
            }
        } catch (\Exception $e) {
            \Log::error("mettreAJourLigneFactureNursing: " . $e->getMessage());
        }
    }

    /**
     * Supprime une ligne facture et ajuste les totaux.
     */
    private function supprimerLigneFactureNursing(int $facId, NursingDossier $dossier): void
    {
        try {
            $facture = Facture::find($facId);
            if (!$facture) return;

            $montant = (float) $facture->MontantTotalFacture;
            $facture->delete();

            if ($dossier->adt_id) {
                $billHd = BillHeader::where('adt_id', $dossier->adt_id)->first();
                if ($billHd) {
                    $billHd->decrement('bill_amount',    $montant);
                    $billHd->decrement('net_amount',     $montant);
                    $billHd->decrement('pending_amount', $montant);
                }
            }
        } catch (\Exception $e) {
            \Log::error("supprimerLigneFactureNursing: " . $e->getMessage());
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

        // Enrichir chaque surveillance avec les URLs des images
        $surveillances->transform(function ($surv) {
            $surv->images_urls = array_map(
                fn($p) => ['path' => $p, 'url' => Storage::disk('public')->url($p)],
                $surv->images ?? []
            );
            return $surv;
        });

        return response()->json([
            'data'    => $surveillances,
            'message' => 'Surveillances récupérées avec succès.',
        ]);
    }

    /**
     * POST /api/v1/nursing-dossiers/{dossier}/surveillances/{surveillance}/images
     * Accepte : image (file) OU image_base64 (string base64)
     */
    public function uploadSurveillanceImage(Request $request, int $dossier, int $surveillance): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);
        $surv   = NursingSurveillance::where('dossier_id', $record->id)->findOrFail($surveillance);

        $storagePath = "nursing/plaies/{$dossier}";
        $filename    = Str::uuid() . '.jpg';
        $fullPath    = "{$storagePath}/{$filename}";

        if ($request->hasFile('image')) {
            // Upload fichier classique
            $request->validate(['image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120']);
            Storage::disk('public')->put($fullPath, file_get_contents($request->file('image')->getRealPath()));
        } elseif ($request->filled('image_base64')) {
            // Capture webcam en base64
            $base64 = $request->input('image_base64');
            // Retirer l'entête data:image/...;base64,
            if (str_contains($base64, ',')) {
                $base64 = explode(',', $base64, 2)[1];
            }
            $decoded = base64_decode($base64);
            if ($decoded === false || strlen($decoded) < 100) {
                return response()->json(['message' => 'Image base64 invalide.'], 422);
            }
            Storage::disk('public')->put($fullPath, $decoded);
        } else {
            return response()->json(['message' => 'Aucune image fournie.'], 422);
        }

        // Ajouter le chemin à la liste des images
        $images   = $surv->images ?? [];
        $images[] = $fullPath;
        $surv->update(['images' => $images]);

        return response()->json([
            'data'    => [
                'path' => $fullPath,
                'url'  => Storage::disk('public')->url($fullPath),
            ],
            'images'  => array_map(fn($p) => ['path' => $p, 'url' => Storage::disk('public')->url($p)], $images),
            'message' => 'Image enregistrée avec succès.',
        ], 201);
    }

    /**
     * DELETE /api/v1/nursing-dossiers/{dossier}/surveillances/{surveillance}/images
     * Body: { path: "nursing/plaies/..." }
     */
    public function deleteSurveillanceImage(Request $request, int $dossier, int $surveillance): JsonResponse
    {
        $record = NursingDossier::findOrFail($dossier);
        $surv   = NursingSurveillance::where('dossier_id', $record->id)->findOrFail($surveillance);

        $request->validate(['path' => 'required|string']);
        $path = $request->input('path');

        // Supprimer le fichier
        Storage::disk('public')->delete($path);

        // Retirer de la liste
        $images = array_values(array_filter($surv->images ?? [], fn($p) => $p !== $path));
        $surv->update(['images' => $images]);

        return response()->json([
            'images'  => array_map(fn($p) => ['path' => $p, 'url' => Storage::disk('public')->url($p)], $images),
            'message' => 'Image supprimée.',
        ]);
    }

    // ── GALERIE D'IMAGES ──────────────────────────────────────────────────────

    /**
     * GET /api/v1/nursing-dossiers/images
     * Agrège toutes les images nursing avec métadonnées patient.
     * Filtres : type, search, date_debut, date_fin
     */
    public function imagesGallery(Request $request): JsonResponse
    {
        $query = NursingSurveillance::with([
            'dossier:id,patient_id',
            'dossier.patient:patient_id,first_name,last_name,patient_code,patient_name',
        ])
        ->whereNotNull('images')
        ->where('images', '!=', 'null')
        ->where('images', '!=', '[]');

        if ($request->filled('type') && $request->type !== 'tout') {
            $query->where('type_surveillance', $request->type);
        }
        if ($request->filled('date_debut')) {
            $query->whereDate('date_surveillance', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('date_surveillance', '<=', $request->date_fin);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->whereHas('dossier.patient', function ($q) use ($s) {
                $q->where('patient_name', 'like', $s)
                  ->orWhere('first_name',  'like', $s)
                  ->orWhere('last_name',   'like', $s)
                  ->orWhere('patient_code','like', $s);
            });
        }

        $surveillances = $query->orderBy('date_surveillance', 'desc')->limit(100)->get();

        $result = [];
        foreach ($surveillances as $surv) {
            $imgPaths = $surv->images ?? [];
            if (!is_array($imgPaths) || empty($imgPaths)) continue;

            $patient    = $surv->dossier?->patient;
            $nomPatient = $patient
                ? ($patient->patient_name ?? trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? '')))
                : 'Patient inconnu';

            foreach ($imgPaths as $path) {
                $result[] = [
                    'key'             => $surv->id . '_' . md5($path),
                    'path'            => $path,
                    'url'             => Storage::disk('public')->url($path),
                    'surveillance_id' => $surv->id,
                    'dossier_id'      => $surv->dossier_id,
                    'type'            => $surv->type_surveillance,
                    'date'            => $surv->date_surveillance?->toDateString(),
                    'observations'    => $surv->observations,
                    'patient_name'    => $nomPatient,
                    'patient_code'    => $patient?->patient_code,
                ];
            }
        }

        return response()->json(['success' => true, 'data' => $result, 'total' => count($result)]);
    }

    /**
     * POST /api/v1/nursing-dossiers/images/upload
     * Upload rapide depuis la galerie (crée une surveillance si inexistante ce jour).
     */
    public function quickUploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'dossier_id'   => 'required|integer|exists:nursing_dossiers,id',
            'type'         => 'required|string|in:plaie,diabete,autre',
            'date'         => 'nullable|date',
            'observations' => 'nullable|string|max:1000',
        ]);

        $dossierId = $request->integer('dossier_id');
        $type      = $request->input('type');
        $date      = $request->input('date', now()->toDateString());

        $surv = NursingSurveillance::firstOrCreate(
            ['dossier_id' => $dossierId, 'type_surveillance' => $type, 'date_surveillance' => $date],
            ['observations' => $request->input('observations', ''), 'images' => []]
        );

        $storagePath = "nursing/plaies/{$dossierId}";
        $filename    = Str::uuid() . '.jpg';
        $fullPath    = "{$storagePath}/{$filename}";

        if ($request->hasFile('image')) {
            $request->validate(['image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120']);
            Storage::disk('public')->put($fullPath, file_get_contents($request->file('image')->getRealPath()));
        } elseif ($request->filled('image_base64')) {
            $base64 = $request->input('image_base64');
            if (str_contains($base64, ',')) $base64 = explode(',', $base64, 2)[1];
            $decoded = base64_decode($base64);
            if ($decoded === false || strlen($decoded) < 100) {
                return response()->json(['message' => 'Image base64 invalide.'], 422);
            }
            Storage::disk('public')->put($fullPath, $decoded);
        } else {
            return response()->json(['message' => 'Aucune image fournie.'], 422);
        }

        $images   = $surv->images ?? [];
        $images[] = $fullPath;
        $surv->update(['images' => $images]);

        $dossier    = NursingDossier::with('patient:patient_id,patient_name,first_name,last_name,patient_code')->find($dossierId);
        $patient    = $dossier?->patient;
        $nomPatient = $patient
            ? ($patient->patient_name ?? trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? '')))
            : 'Patient inconnu';

        return response()->json([
            'success' => true,
            'data'    => [
                'key'             => $surv->id . '_' . md5($fullPath),
                'path'            => $fullPath,
                'url'             => Storage::disk('public')->url($fullPath),
                'surveillance_id' => $surv->id,
                'dossier_id'      => $dossierId,
                'type'            => $type,
                'date'            => $date,
                'observations'    => $request->input('observations', ''),
                'patient_name'    => $nomPatient,
                'patient_code'    => $patient?->patient_code,
            ],
            'message' => 'Image ajoutée avec succès.',
        ], 201);
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
