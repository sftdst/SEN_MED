<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PartenaireHeader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

class PatientController extends Controller
{
    /**
     * Liste des patients avec recherche et filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Patient::query();

        if ($request->filled('search')) {
            $query->recherche($request->search);
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->filled('status')) {
            $query->where('status_id', $request->status);
        }

        $patients = $query->orderBy('patient_name')->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data'    => $patients,
        ]);
    }

    /**
     * Création RAPIDE du patient (accueil/réception)
     * Données minimales : nom, prénom, dob, partenaire, type_couverture
     */
    public function storeRapide(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'               => 'required|string|max:100',
            'last_name'                => 'required|string|max:100',
            'dob'                      => 'required|date|before:today',
            'gender_id'                => 'nullable|string|max:20',
            'mobile_number'            => 'nullable|string|max:15',
            'emergency_contact_number' => 'nullable|string|max:50',
            'company_id'               => 'nullable|exists:gen_mst_partenaire_header,id_Rep',
            'type_couverture'          => 'nullable|string|max:50',
        ]);

        // Vérifier que le type de couverture existe pour ce partenaire (si fourni)
        if ($validated['company_id'] && $validated['type_couverture']) {
            $partenaire = PartenaireHeader::find($validated['company_id']);
            if (!$partenaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Partenaire non trouvé.',
                ], 404);
            }

            $couvertureExists = $partenaire->typesCouverture()
                ->where('Nom', $validated['type_couverture'])
                ->exists();

            if (!$couvertureExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type de couverture invalide pour ce partenaire.',
                ], 422);
            }
        }

        // Créer le patient
        $validated['patient_id'] = $this->genererIdPatient();
        $validated['patient_code'] = $this->genererCodePatient();
        $validated['patient_name'] = trim($validated['first_name'] . ' ' . $validated['last_name']);
        $validated['age_patient'] = Carbon::parse($validated['dob'])->age;
        $validated['status_id'] = 1;
        $validated['created_dttm'] = now();
        $validated['created_user_id'] = auth()?->user()?->id ?? 'SYSTEM';

        $patient = Patient::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Patient créé rapidement avec succès.',
            'data'    => $patient,
        ], 201);
    }

    /**
     * Création COMPLÈTE du patient (admin/dossier détaillé)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'               => 'required|string|max:100',
            'second_name'              => 'nullable|string|max:50',
            'last_name'                => 'required|string|max:100',
            'gender_id'                => 'nullable|string|max:20',
            'dob'                      => 'required|date|before:today',
            'lieu_naissance'           => 'nullable|string|max:50',
            'marital_status_id'        => 'nullable|string|max:20',
            'nationality_id'           => 'nullable|string|max:20',
            'country'                  => 'nullable|string|max:100',
            'city'                     => 'nullable|string|max:100',
            'address'                  => 'nullable|string|max:400',
            'address2'                 => 'nullable|string|max:400',
            'postal_code'              => 'nullable|string|max:10',
            'contact_number'           => 'nullable|string|max:15',
            'mobile_number'            => 'nullable|string|max:15',
            'email_adress'             => 'nullable|email|max:200',
            'emergency_contact_name'   => 'nullable|string|max:200',
            'emergency_contact_number' => 'nullable|string|max:50',
            'pere_name'                => 'nullable|string|max:50',
            'mere_name'                => 'nullable|string|max:50',
            'profession'               => 'nullable|string|max:100',
            'emplos'                   => 'nullable|string|max:50',
            'socite'                   => 'nullable|string|max:50',
            'lieu_travail'             => 'nullable|string|max:50',
            'company_id'               => 'nullable|exists:gen_mst_partenaire_header,id_Rep',
            'type_couverture'          => 'nullable|string|max:50',
            'num_police'               => 'nullable|string|max:50',
            'validate'                 => 'nullable|date',
            'family_doctor'            => 'nullable|string|max:200',
            'ssn_no'                   => 'nullable|string|max:100|unique:gen_mst_patient,ssn_no',
        ]);

        // Vérifier la cohérence couverture si partenaire spécifié
        if ($validated['company_id'] && $validated['type_couverture']) {
            $partenaire = PartenaireHeader::find($validated['company_id']);
            $couvertureExists = $partenaire->typesCouverture()
                ->where('Nom', $validated['type_couverture'])
                ->exists();

            if (!$couvertureExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type de couverture invalide pour ce partenaire.',
                    'errors'  => ['type_couverture' => ['Type invalide']],
                ], 422);
            }
        }

        // Générer les identifiants
        $validated['patient_id'] = $this->genererIdPatient();
        $validated['patient_code'] = $this->genererCodePatient();
        $validated['patient_name'] = trim(($validated['first_name'] ?? '') . ' ' . ($validated['last_name'] ?? ''));
        $validated['age_patient'] = Carbon::parse($validated['dob'])->age;
        $validated['status_id'] = 1;
        $validated['created_dttm'] = now();
        $validated['created_user_id'] = auth()?->user()?->id ?? 'SYSTEM';

        $patient = Patient::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Fiche patient créée avec succès.',
            'data'    => $patient,
        ], 201);
    }

    /**
     * Détails d'un patient
     */
    public function show(Patient $patient): JsonResponse
    {
        $patient->load('partenaire');

        return response()->json([
            'success' => true,
            'data'    => $patient,
        ]);
    }

    /**
     * Modification d'un patient
     */
    public function update(Request $request, Patient $patient): JsonResponse
    {
        $validated = $request->validate([
            'first_name'               => 'sometimes|string|max:100',
            'second_name'              => 'nullable|string|max:50',
            'last_name'                => 'sometimes|string|max:100',
            'gender_id'                => 'nullable|string|max:20',
            'dob'                      => 'sometimes|date|before:today',
            'lieu_naissance'           => 'nullable|string|max:50',
            'marital_status_id'        => 'nullable|string|max:20',
            'nationality_id'           => 'nullable|string|max:20',
            'country'                  => 'nullable|string|max:100',
            'city'                     => 'nullable|string|max:100',
            'address'                  => 'nullable|string|max:400',
            'address2'                 => 'nullable|string|max:400',
            'postal_code'              => 'nullable|string|max:10',
            'contact_number'           => 'nullable|string|max:15',
            'mobile_number'            => 'nullable|string|max:15',
            'email_adress'             => 'nullable|email|max:200',
            'emergency_contact_name'   => 'nullable|string|max:200',
            'emergency_contact_number' => 'nullable|string|max:50',
            'pere_name'                => 'nullable|string|max:50',
            'mere_name'                => 'nullable|string|max:50',
            'profession'               => 'nullable|string|max:100',
            'emplos'                   => 'nullable|string|max:50',
            'socite'                   => 'nullable|string|max:50',
            'lieu_travail'             => 'nullable|string|max:50',
            'company_id'               => 'nullable|exists:gen_mst_partenaire_header,id_Rep',
            'type_couverture'          => 'nullable|string|max:50',
            'num_police'               => 'nullable|string|max:50',
            'validate'                 => 'nullable|date',
            'family_doctor'            => 'nullable|string|max:200',
            'pending_amount'           => 'nullable|numeric|min:0',
            'status_id'                => 'nullable|integer|in:0,1',
        ]);

        // Vérifier cohérence couverture
        if ($validated['company_id'] ?? false && $validated['type_couverture'] ?? false) {
            $partenaire = PartenaireHeader::find($validated['company_id']);
            $couvertureExists = $partenaire->typesCouverture()
                ->where('Nom', $validated['type_couverture'])
                ->exists();

            if (!$couvertureExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type de couverture invalide pour ce partenaire.',
                ], 422);
            }
        }

        // Mettre à jour patient_name et age_patient si nom ou date changés
        if (isset($validated['first_name']) || isset($validated['last_name'])) {
            $validated['patient_name'] = trim(
                ($validated['first_name'] ?? $patient->first_name) . ' ' .
                ($validated['last_name'] ?? $patient->last_name)
            );
        }

        if (isset($validated['dob'])) {
            $validated['age_patient'] = Carbon::parse($validated['dob'])->age;
        }

        $validated['modified_dttm'] = now();
        $patient->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Patient modifié avec succès.',
            'data'    => $patient->fresh(),
        ]);
    }

    /**
     * Suppression d'un patient
     */
    public function destroy(Patient $patient): JsonResponse
    {
        $patient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Patient supprimé.',
        ]);
    }

    /**
     * Obtenir les types de couverture pour un partenaire
     */
    public function typesCouverturePartenaire(PartenaireHeader $partenaire): JsonResponse
    {
        $types = $partenaire->typesCouverture()
            ->select('id_Rep', 'Nom')
            ->orderBy('Nom')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $types,
        ]);
    }

    /**
     * Métadonnées (genres, statuts matrimoniaux, etc.)
     */
    public function metadata(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'genders' => [
                    ['value' => 'M', 'label' => 'Masculin'],
                    ['value' => 'F', 'label' => 'Féminin'],
                    ['value' => 'O', 'label' => 'Autre'],
                ],
                'marital_statuses' => [
                    ['value' => 'C', 'label' => 'Célibataire'],
                    ['value' => 'M', 'label' => 'Marié(e)'],
                    ['value' => 'D', 'label' => 'Divorcé(e)'],
                    ['value' => 'V', 'label' => 'Veuf(ve)'],
                    ['value' => 'P', 'label' => 'PACS'],
                ],
                'countries' => [
                    ['value' => 'Sénégal', 'label' => 'Sénégal'],
                    ['value' => 'Mali', 'label' => 'Mali'],
                    ['value' => "Côte d'Ivoire", 'label' => "Côte d'Ivoire"],
                    ['value' => 'Mauritanie', 'label' => 'Mauritanie'],
                    ['value' => 'Guinée', 'label' => 'Guinée'],
                    ['value' => 'France', 'label' => 'France'],
                ],
                'titles' => [
                    ['value' => 'M', 'label' => 'Mr'],
                    ['value' => 'Mme', 'label' => 'Mme'],
                    ['value' => 'Mlle', 'label' => 'Mlle'],
                ],
            ],
        ]);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Helpers
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    private function genererIdPatient(): string
    {
        do { $id = 'PAT-' . strtoupper(Str::random(8)); }
        while (Patient::where('patient_id', $id)->exists());
        return $id;
    }

    private function genererCodePatient(): string
    {
        $timestamp = now()->format('ymd');
        $random = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $code = $timestamp . $random; // Format: ymddddddd

        do { $code = $timestamp . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT); }
        while (Patient::where('patient_code', $code)->exists());

        return $code;
    }

    public function genererCarte(Patient $patient): JsonResponse
    {
        $carteNumero = $patient->carte_numero ?? $this->genererCarteNumero($patient);
        
        if (!$patient->carte_numero) {
            $patient->update(['carte_numero' => $carteNumero]);
        }

        $qrData = json_encode([
            'carte_numero' => $carteNumero,
            'patient_id' => $patient->patient_id,
            'nom' => $patient->patient_name,
            'dob' => $patient->dob?->format('Y-m-d'),
            'genre' => $patient->gender_id,
            'telephone' => $patient->mobile_number,
            'assurance' => $patient->partenaire?->Nom,
            'couverture' => $patient->type_couverture,
            'num_police' => $patient->num_police,
        ], JSON_UNESCAPED_UNICODE);

        $qrCodeBase64 = null;
        if (extension_loaded('gd')) {
            $qrCode = new QrCode($qrData);
            $writer = new PngWriter();
            $result = $writer->write($qrCode);
            $qrCodeBase64 = 'data:image/png;base64,' . base64_encode($result->getString());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'carte_numero' => $carteNumero,
                'patient_id' => $patient->patient_id,
                'nom' => $patient->patient_name,
                'prenom' => $patient->first_name,
                'nom_famille' => $patient->last_name,
                'date_naissance' => $patient->dob?->format('d/m/Y'),
                'age' => $patient->age_patient,
                'genre' => $patient->gender_id,
                'telephone' => $patient->mobile_number,
                'email' => $patient->email_adress,
                'adresse' => $patient->address,
                'ville' => $patient->city,
                'photo' => $patient->photo,
                'assurance' => $patient->partenaire?->Nom,
                'couverture' => $patient->type_couverture,
                'num_police' => $patient->num_police,
                'validite' => $patient->validate?->format('d/m/Y'),
                'qr_code' => $qrCodeBase64,
            ],
        ]);
    }

    private function genererCarteNumero(Patient $patient): string
    {
        $prefix = 'SM';
        $year = now()->format('Y');
        $uniqueId = str_pad($patient->id_Rep, 6, '0', STR_PAD_LEFT);
        return $prefix . $year . $uniqueId;
    }
}
