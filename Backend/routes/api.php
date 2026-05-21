<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HospitalController;
use App\Http\Controllers\Api\DepartementController;
use App\Http\Controllers\Api\TypeServiceController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\PersonnelController;
use App\Http\Controllers\Api\HoraireController;
use App\Http\Controllers\Api\ExceptionController;
use App\Http\Controllers\Api\JourFerieController;
use App\Http\Controllers\Api\FerieDisponibiliteController;
use App\Http\Controllers\Api\CreneauxController;
use App\Http\Controllers\Api\PartenaireController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\VisiteController;
use App\Http\Controllers\Api\ChambreController;
use App\Http\Controllers\Api\HospitalisationController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\ProductItemController;
use App\Http\Controllers\Api\MedecinTarifController;
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\CommandeController;
use App\Http\Controllers\Api\ApprovisionnementController;
use App\Http\Controllers\Api\MouvementStockController;
use App\Http\Controllers\Api\InventaireController;
use App\Http\Controllers\Api\TransfertController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\FicheAttController;
use App\Http\Controllers\Api\ComptabiliteController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\DocumentTemplateController;
use App\Http\Controllers\Api\GeneratedCertificateController;
use App\Http\Controllers\Api\NursingDossierController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MailingConfigController;
use App\Http\Controllers\Api\AppPreferenceController;
use App\Http\Controllers\Api\WebPublicController;
use App\Http\Controllers\Api\MatMedEquipementController;
use App\Http\Controllers\Api\MatMedLocationController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Gestion de l'Organisation - SenMed
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Authentification ───────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('login',    [AuthController::class, 'login']);
        Route::post('register', [AuthController::class, 'register']);
        Route::post('logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::get('me',       [AuthController::class, 'me'])->middleware('auth:sanctum');
        Route::post('refresh', [AuthController::class, 'refresh'])->middleware('auth:sanctum');
    });

    // Hôpitaux / Organisations
    Route::apiResource('hospitals', HospitalController::class)
        ->parameters(['hospitals' => 'hospital']);

    // Départements
    Route::apiResource('departements', DepartementController::class)
        ->parameters(['departements' => 'departement']);

    // Types de service
    Route::apiResource('type-services', TypeServiceController::class)
        ->parameters(['type-services' => 'typeService']);

    // Services
    Route::apiResource('services', ServiceController::class)
        ->parameters(['services' => 'service']);

    /*
    |--------------------------------------------------------------------------
    | Gestion des Personnels (RH)
    |--------------------------------------------------------------------------
    */

    // Métadonnées (labels, listes de choix) — avant la resource pour éviter le conflit
    Route::get('personnels/metadata', [PersonnelController::class, 'metadata']);

    // Création rapide (champs essentiels uniquement)
    Route::post('personnels/creation-rapide', [PersonnelController::class, 'storeRapide']);

    // CRUD complet
    Route::apiResource('personnels', PersonnelController::class)
        ->parameters(['personnels' => 'personnel']);

    /*
    |--------------------------------------------------------------------------
    | Module Planning / Emplois du temps
    |--------------------------------------------------------------------------
    */
    Route::prefix('planning')->group(function () {

        // ── Horaires hebdomadaires ────────────────────────────────────────
        Route::get('horaires/medecin/{id}', [HoraireController::class, 'planningMedecin']);
        Route::apiResource('horaires', HoraireController::class)
            ->parameters(['horaires' => 'horaire']);

        // ── Absences / Exceptions ─────────────────────────────────────────
        Route::apiResource('exceptions', ExceptionController::class)
            ->parameters(['exceptions' => 'exception']);

        // ── Jours fériés ──────────────────────────────────────────────────
        Route::post('jours-feries/initialiser', [JourFerieController::class, 'initialiserSenegal']);
        Route::apiResource('jours-feries', JourFerieController::class)
            ->parameters(['jours-feries' => 'jourFerie']);

        // ── Disponibilités jours fériés ───────────────────────────────────
        Route::apiResource('ferie-disponibilites', FerieDisponibiliteController::class)
            ->parameters(['ferie-disponibilites' => 'ferieDisponibilite']);

        // ── Créneaux (moteur) ─────────────────────────────────────────────
        Route::get('creneaux',         [CreneauxController::class, 'creneauxDuJour']);
        Route::get('creneaux/semaine', [CreneauxController::class, 'creneauxSemaine']);
        Route::get('synthese/{idMedecin}', [CreneauxController::class, 'synthese']);
    });

    /*
    |--------------------------------------------------------------------------
    | Module Consultation (Cls_Patient_Quick_Notes_New)
    |--------------------------------------------------------------------------
    */
    Route::prefix('consultations/{visite}')->group(function () {

        // Fiche globale
        Route::get('/',           [ConsultationController::class, 'show']);
        Route::post('/sauvegarder', [ConsultationController::class, 'sauvegarder']);

        // Signes vitaux
        Route::get('/vitalsigns',              [ConsultationController::class, 'indexVitalSigns']);
        Route::post('/vitalsigns',             [ConsultationController::class, 'storeVitalSign']);
        Route::put('/vitalsigns/{vitalSign}',  [ConsultationController::class, 'updateVitalSign']);

        // Notes ADT
        Route::get('/adt-notes',              [ConsultationController::class, 'indexAdtNotes']);
        Route::post('/adt-notes',             [ConsultationController::class, 'storeAdtNote']);
        Route::put('/adt-notes/{adtNote}',    [ConsultationController::class, 'updateAdtNote']);
        Route::delete('/adt-notes/{adtNote}', [ConsultationController::class, 'destroyAdtNote']);

        // Notes patient
        Route::get('/patient-notes',                  [ConsultationController::class, 'indexPatientNotes']);
        Route::post('/patient-notes',                 [ConsultationController::class, 'storePatientNote']);
        Route::put('/patient-notes/{patientNote}',    [ConsultationController::class, 'updatePatientNote']);
        Route::delete('/patient-notes/{patientNote}', [ConsultationController::class, 'destroyPatientNote']);

        // Prescriptions (médicaments de la consultation)
        Route::get('/medications',               [ConsultationController::class, 'indexMedications']);
        Route::post('/medications',              [ConsultationController::class, 'storeMedication']);
        Route::put('/medications/{medication}',  [ConsultationController::class, 'updateMedication']);
        Route::delete('/medications/{medication}', [ConsultationController::class, 'destroyMedication']);

        // Procédures cliniques
        Route::get('/procedures',               [ConsultationController::class, 'indexProcedures']);
        Route::post('/procedures',              [ConsultationController::class, 'storeProcedure']);
        Route::put('/procedures/{procedure}',   [ConsultationController::class, 'updateProcedure']);
        Route::delete('/procedures/{procedure}', [ConsultationController::class, 'destroyProcedure']);

        // Examens de laboratoire
        Route::get('/lab-procedures',                    [ConsultationController::class, 'indexLabProcedures']);
        Route::post('/lab-procedures',                   [ConsultationController::class, 'storeLabProcedure']);
        Route::put('/lab-procedures/{labProcedure}',     [ConsultationController::class, 'updateLabProcedure']);
        Route::delete('/lab-procedures/{labProcedure}',  [ConsultationController::class, 'destroyLabProcedure']);

        // Ordonnance (1 seule par visite — upsert)
        Route::get('/ordonnance',  [ConsultationController::class, 'getOrdonnance']);
        Route::post('/ordonnance', [ConsultationController::class, 'saveOrdonnance']);

        // Factures de la visite
        Route::get('/factures', [ConsultationController::class, 'getFactures']);
    });

    // Matrix comparatif multi-visites (par patient)
    Route::get('patients/{patientId}/matrix', [ConsultationController::class, 'getMatrix']);

    // Traitements chroniques (rattachés au patient, pas à une visite)
    Route::prefix('patients/{patientId}/long-term-medications')->group(function () {
        Route::get('/',                      [ConsultationController::class, 'indexLongTermMeds']);
        Route::post('/',                     [ConsultationController::class, 'storeLongTermMed']);
        Route::put('/{medication}',          [ConsultationController::class, 'updateLongTermMed']);
        Route::delete('/{medication}',       [ConsultationController::class, 'destroyLongTermMed']);
    });

    /*
    |--------------------------------------------------------------------------
    | Module Partenaires & Types de couverture
    |--------------------------------------------------------------------------
    */
    Route::prefix('partenaires')->group(function () {
        // Types de couverture (nested sous partenaire)
        Route::get('{partenaire}/couvertures',               [PartenaireController::class, 'couvertures']);
        Route::post('{partenaire}/couvertures',              [PartenaireController::class, 'ajouterCouverture']);
        Route::put('{partenaire}/couvertures/{couverture}',  [PartenaireController::class, 'modifierCouverture']);
        Route::delete('{partenaire}/couvertures/{couverture}', [PartenaireController::class, 'supprimerCouverture']);
    });

    // CRUD partenaires (header)
    Route::apiResource('partenaires', PartenaireController::class)
        ->parameters(['partenaires' => 'partenaire']);

    /*
    |--------------------------------------------------------------------------
    | Module Patients
    |--------------------------------------------------------------------------
    */
    // Métadonnées (genres, statuts matrimoniaux, nationalités...)
    Route::get('patients/metadata', [PatientController::class, 'metadata']);

    // Création rapide (accueil/réception)
    Route::post('patients/creation-rapide', [PatientController::class, 'storeRapide']);

    // Types de couverture pour un partenaire
    Route::get('patients/partenaire/{partenaire}/couvertures', [PatientController::class, 'typesCouverturePartenaire']);

    // Générer carte patient (QR code)
    Route::get('patients/{patient}/carte', [PatientController::class, 'genererCarte']);

    // CRUD complet patients
    Route::apiResource('patients', PatientController::class)
        ->parameters(['patients' => 'patient']);

    /*
    |--------------------------------------------------------------------------
    | Module Visites
    |--------------------------------------------------------------------------
    */
    // Métadonnées (lieux RDV, types visite, liens de parenté)
    Route::get('visites/metadata', [VisiteController::class, 'metadata']);

    // Salle d'attente
    Route::get('salle-attente', [VisiteController::class, 'salleAttente']);
    Route::patch('salle-attente/{visite}/marquer-vu', [VisiteController::class, 'marquerVu']);

    // CRUD visites
    Route::apiResource('visites', VisiteController::class)
        ->parameters(['visites' => 'visite'])
        ->only(['index', 'store', 'show']);

    /*
    |--------------------------------------------------------------------------
    | Module Hospitalisation
    |--------------------------------------------------------------------------
    */

    // ── Chambres ──────────────────────────────────────────────────────────────
    Route::get('chambres/dashboard',                             [ChambreController::class, 'dashboard']);
    Route::get('chambres/{chambre}/equipements',                 [ChambreController::class, 'equipements']);
    Route::post('chambres/{chambre}/equipements',                [ChambreController::class, 'ajouterEquipement']);
    Route::delete('chambres/{chambre}/equipements/{equipement}', [ChambreController::class, 'retirerEquipement']);
    Route::apiResource('chambres', ChambreController::class)
        ->parameters(['chambres' => 'chambre']);

    // ── Équipements (catalogue) ───────────────────────────────────────────────
    Route::get('equipements',           [ChambreController::class, 'indexEquipements']);
    Route::post('equipements',          [ChambreController::class, 'storeEquipement']);
    Route::put('equipements/{equipement}', [ChambreController::class, 'updateEquipement']);
    Route::delete('equipements/{equipement}', [ChambreController::class, 'destroyEquipement']);

    // ── Hospitalisations ──────────────────────────────────────────────────────
    Route::get('hospitalisations/dashboard',                    [HospitalisationController::class, 'dashboard']);
    Route::post('hospitalisations/{hospitalisation}/sortie',    [HospitalisationController::class, 'sortie']);
    Route::patch('chambres/{chambre}/marquer-propre',           [HospitalisationController::class, 'marquerPropre']);
    Route::apiResource('hospitalisations', HospitalisationController::class)
        ->parameters(['hospitalisations' => 'hospitalisation'])
        ->only(['index', 'store', 'show']);

    /*
    |--------------------------------------------------------------------------
    | Module Rendez-Vous (Appointments)
    |--------------------------------------------------------------------------
    */
    Route::get('appointments/demandes',          [AppointmentController::class, 'demandesListe']);
    Route::patch('appointments/{id}/accepter',   [AppointmentController::class, 'accepter']);
    Route::patch('appointments/{id}/rejeter',    [AppointmentController::class, 'rejeter']);
    Route::get('appointments/creneaux-disponibles', [AppointmentController::class, 'creneauxDisponibles']);
    Route::apiResource('appointments', AppointmentController::class)
        ->parameters(['appointments' => 'appointment']);

    /*
    |--------------------------------------------------------------------------
    | Module Tarification Médecins
    |--------------------------------------------------------------------------
    */
    // Résolution de tarif (avant apiResource pour éviter conflit de route)
    Route::get('medecin-tarifs/resoudre', [MedecinTarifController::class, 'resoudre']);
    // Revenus d'un médecin
    Route::get('medecin-tarifs/medecin/{medecinId}/revenus', [MedecinTarifController::class, 'revenus']);
    // CRUD tarifs médecins
    Route::apiResource('medecin-tarifs', MedecinTarifController::class)
        ->parameters(['medecin-tarifs' => 'medecinTarif']);

    /*
    |--------------------------------------------------------------------------
    | Module Transferts de Patients
    |--------------------------------------------------------------------------
    */
    Route::get('transferts/stats',                      [TransfertController::class, 'stats']);
    Route::post('transferts/{transfert}/valider',       [TransfertController::class, 'valider']);
    Route::post('transferts/{transfert}/annuler',       [TransfertController::class, 'annuler']);
    Route::apiResource('transferts', TransfertController::class)
        ->parameters(['transferts' => 'transfert'])
        ->only(['index', 'store', 'show']);

    /*
    |--------------------------------------------------------------------------
    | Module Fiches d'Attachement (examens, captures webcam)
    |--------------------------------------------------------------------------
    */
    // Route nommée pour servir les fichiers (utilisée dans FicheAtt::getUrlAttribute)
    Route::get('fiches-att/{fiche}/serve', [FicheAttController::class, 'serve'])
        ->name('fiches-att.serve');
    Route::apiResource('fiches-att', FicheAttController::class)
        ->parameters(['fiches-att' => 'fiche'])
        ->only(['index', 'store', 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Module Comptabilité
    |--------------------------------------------------------------------------
    */
    Route::get('comptabilite/factures-en-attente', [ComptabiliteController::class, 'facturesEnAttente']);
    Route::get('comptabilite/credits-patients',                          [ComptabiliteController::class, 'creditsPatients']);
    Route::get('comptabilite/credits-patients/{patientId}/factures',     [ComptabiliteController::class, 'creditPatientFactures']);
    Route::get('comptabilite/partenaires',          [ComptabiliteController::class, 'partenaires']);
    Route::get('comptabilite/recettes',             [ComptabiliteController::class, 'recettes']);

    /*
    |--------------------------------------------------------------------------
    | Module Paiement
    |--------------------------------------------------------------------------
    */
    Route::get('paiements/historique',                      [PaiementController::class, 'historique']);
    Route::post('paiements/patient/{patientId}/solder',     [PaiementController::class, 'solderPatient']);
    Route::get('paiements/{billId}',                        [PaiementController::class, 'detail']);
    Route::post('paiements/{billId}/payer',                 [PaiementController::class, 'payer']);
    Route::post('paiements/{billId}/attente',               [PaiementController::class, 'mettreEnAttente']);

    /*
    |--------------------------------------------------------------------------
    | Module Pharmacie - Gestion des produits
    |--------------------------------------------------------------------------
    */
    Route::get('pharmacie/items/metadata', [ProductItemController::class, 'metadata']);
    Route::apiResource('pharmacie/items', ProductItemController::class)
        ->parameters(['pharmacie/items' => 'item']);

    /*
    |--------------------------------------------------------------------------
    | Module Pharmacie - Gestion des fournisseurs
    |--------------------------------------------------------------------------
    */
    Route::apiResource('pharmacie/fournisseurs', FournisseurController::class)
        ->parameters(['pharmacie/fournisseurs' => 'fournisseur']);

    /*
    |--------------------------------------------------------------------------
    | Module Pharmacie - Commandes
    |--------------------------------------------------------------------------
    */
    Route::get('pharmacie/commandes/stats', [CommandeController::class, 'listeParStatut']);
    Route::apiResource('pharmacie/commandes', CommandeController::class)
        ->parameters(['pharmacie/commandes' => 'commande']);

    /*
    |--------------------------------------------------------------------------
    | Module Pharmacie - Approvisionnements
    |--------------------------------------------------------------------------
    */
    Route::get('pharmacie/approvisionnements/stats', [ApprovisionnementController::class, 'stats']);
    Route::apiResource('pharmacie/approvisionnements', ApprovisionnementController::class)
        ->parameters(['pharmacie/approvisionnements' => 'approvisionnement']);

    /*
    |--------------------------------------------------------------------------
    | Module Pharmacie - Mouvements de stock
    |--------------------------------------------------------------------------
    */
    Route::get('pharmacie/mouvements/historique/{itemId}', [MouvementStockController::class, 'historique']);
    Route::get('pharmacie/mouvements/stats', [MouvementStockController::class, 'stats']);
    Route::apiResource('pharmacie/mouvements', MouvementStockController::class)
        ->parameters(['pharmacie/mouvements' => 'mouvement']);

    /*
    |--------------------------------------------------------------------------
    | Module Pharmacie - Inventaires
    |--------------------------------------------------------------------------
    */
    Route::post('pharmacie/inventaires/{inventaire}/cloturer', [InventaireController::class, 'cloturer']);
    Route::put('pharmacie/inventaires/detail/{detail}', [InventaireController::class, 'updateDetail']);
    Route::apiResource('pharmacie/inventaires', InventaireController::class)
        ->parameters(['pharmacie/inventaires' => 'inventaire']);

    /*
    |--------------------------------------------------------------------------
    | Module Formulaires — Modèles de documents & variables
    |--------------------------------------------------------------------------
    */
    // Variables (avant apiResource pour éviter conflit)
    Route::get('formulaires/variables',                    [DocumentTemplateController::class, 'variables']);
    Route::post('formulaires/variables',                   [DocumentTemplateController::class, 'storeVariable']);
    Route::put('formulaires/variables/{variable}',         [DocumentTemplateController::class, 'updateVariable']);
    Route::delete('formulaires/variables/{variable}',      [DocumentTemplateController::class, 'destroyVariable']);

    // Templates CRUD
    Route::apiResource('formulaires', DocumentTemplateController::class)
        ->parameters(['formulaires' => 'template']);

    // ── Certificats générés ───────────────────────────────────────────────────
    Route::get('generated-certificates',  [GeneratedCertificateController::class, 'index']);
    Route::post('generated-certificates', [GeneratedCertificateController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Module DSI — Dossier de Soins Infirmiers
    |--------------------------------------------------------------------------
    */

    // Routes spéciales (avant apiResource pour éviter conflits)
    Route::get('nursing-dossiers/dashboard',       [NursingDossierController::class, 'dashboard']);
    Route::get('nursing-dossiers/images',          [NursingDossierController::class, 'imagesGallery']);
    Route::post('nursing-dossiers/images/upload',  [NursingDossierController::class, 'quickUploadImage']);

    // CRUD principal
    Route::apiResource('nursing-dossiers', NursingDossierController::class)
        ->parameters(['nursing-dossiers' => 'dossier']);

    // ── Contacts & Intervenants ───────────────────────────────────────────────
    Route::put('nursing-dossiers/{dossier}/contacts',    [NursingDossierController::class, 'updateContacts']);
    Route::put('nursing-dossiers/{dossier}/intervenants',[NursingDossierController::class, 'updateIntervenants']);

    // ── Traitements ───────────────────────────────────────────────────────────
    Route::post('nursing-dossiers/{dossier}/treatments',                      [NursingDossierController::class, 'storeTreatment']);
    Route::put('nursing-dossiers/{dossier}/treatments/{treatment}',           [NursingDossierController::class, 'updateTreatment']);
    Route::delete('nursing-dossiers/{dossier}/treatments/{treatment}',        [NursingDossierController::class, 'destroyTreatment']);

    // ── Diagramme de soins ────────────────────────────────────────────────────
    Route::get('nursing-dossiers/{dossier}/care-diagram',  [NursingDossierController::class, 'getCareDiagram']);
    Route::post('nursing-dossiers/{dossier}/care-records', [NursingDossierController::class, 'storeCareRecord']);

    // ── Transmissions ─────────────────────────────────────────────────────────
    Route::post('nursing-dossiers/{dossier}/transmissions',                   [NursingDossierController::class, 'storeTransmission']);
    Route::delete('nursing-dossiers/{dossier}/transmissions/{transmission}',  [NursingDossierController::class, 'destroyTransmission']);

    // ── Évaluations (échelles) ────────────────────────────────────────────────
    Route::get('nursing-dossiers/{dossier}/assessments',  [NursingDossierController::class, 'getAssessments']);
    Route::post('nursing-dossiers/{dossier}/assessments', [NursingDossierController::class, 'storeAssessment']);

    // ── Surveillances ─────────────────────────────────────────────────────────
    Route::get('nursing-dossiers/{dossier}/surveillances',  [NursingDossierController::class, 'getSurveillances']);
    Route::post('nursing-dossiers/{dossier}/surveillances', [NursingDossierController::class, 'storeSurveillance']);

     // ── Images de surveillance (plaie) ────────────────────────────────────────
     Route::post('nursing-dossiers/{dossier}/surveillances/{surveillance}/images',   [NursingDossierController::class, 'uploadSurveillanceImage']);
     Route::delete('nursing-dossiers/{dossier}/surveillances/{surveillance}/images', [NursingDossierController::class, 'deleteSurveillanceImage']);

    /*
    |--------------------------------------------------------------------------
    | Module Chat & Messagerie interne
    |--------------------------------------------------------------------------
    */
    Route::get('chat/users',                              [ChatController::class, 'users']);
    Route::get('chat/conversations',                      [ChatController::class, 'conversations']);
    Route::post('chat/conversations',                     [ChatController::class, 'createConversation']);
    Route::get('chat/conversations/{conv}/messages',      [ChatController::class, 'messages']);
    Route::post('chat/conversations/{conv}/messages',     [ChatController::class, 'sendMessage']);
    Route::put('chat/conversations/{conv}/read',          [ChatController::class, 'markRead']);
    Route::get('chat/unread-count',                       [ChatController::class, 'unreadCount']);

    // ── Gestion des Profils et Droits ─────────────────────────────────────────
    Route::get('roles',                          [RolePermissionController::class, 'index']);
    Route::get('roles/{role}',                   [RolePermissionController::class, 'show']);
    Route::post('roles',                         [RolePermissionController::class, 'store']);
    Route::put('roles/{role}',                   [RolePermissionController::class, 'update']);
    Route::delete('roles/{role}',                [RolePermissionController::class, 'destroy']);
    Route::post('roles/{role}/permissions',      [RolePermissionController::class, 'syncPermissions']);

    Route::get('permissions',                    [RolePermissionController::class, 'permissionIndex']);
    Route::post('permissions',                   [RolePermissionController::class, 'permissionStore']);
    Route::put('permissions/{id}',               [RolePermissionController::class, 'permissionStore']);
    Route::delete('permissions/{id}',            [RolePermissionController::class, 'permissionDestroy']);

    /*
    |--------------------------------------------------------------------------
    | Configuration Mailing (SMTP)
    |--------------------------------------------------------------------------
    */
    Route::get('mailing-config',       [MailingConfigController::class, 'show']);
    Route::post('mailing-config',      [MailingConfigController::class, 'save']);
    Route::post('mailing-config/test', [MailingConfigController::class, 'test']);

    /*
    |--------------------------------------------------------------------------
    | Préférences de l'application
    |--------------------------------------------------------------------------
    */
    Route::get('app-preferences',  [AppPreferenceController::class, 'show']);
    Route::post('app-preferences', [AppPreferenceController::class, 'save']);

    /*
    |--------------------------------------------------------------------------
    | API Publique - Page Web
    |--------------------------------------------------------------------------
    */
    Route::prefix('public')->group(function () {
        Route::get('preferences', [WebPublicController::class, 'preferences']);
        Route::get('slides',      [WebPublicController::class, 'slides']);
        Route::get('about',       [WebPublicController::class, 'about']);
        Route::get('services',    [WebPublicController::class, 'services']);
        Route::get('specialistes', [WebPublicController::class, 'specialistes']);
        Route::get('partenaires', [WebPublicController::class, 'partenaires']);
        Route::post('contact',      [WebPublicController::class, 'contact']);
        Route::post('appointments', [WebPublicController::class, 'publicAppointment']);
    });

    /*
    |--------------------------------------------------------------------------
    | API Admin - Gestion Page Web
    |--------------------------------------------------------------------------
    */
    Route::prefix('web/admin')->group(function () {
        // Slides (diaporama)
        Route::get('slides',                  [WebPublicController::class, 'adminSlidesList']);
        Route::post('slides',                 [WebPublicController::class, 'adminSlidesStore']);
        Route::put('slides/{id}',             [WebPublicController::class, 'adminSlidesUpdate']);
        Route::delete('slides/{id}',          [WebPublicController::class, 'adminSlidesDestroy']);
        Route::patch('slides/{id}/toggle',    [WebPublicController::class, 'adminSlidesToggle']);
        // Section À propos
        Route::get('about',                   [WebPublicController::class, 'adminAboutGet']);
        Route::post('about',                  [WebPublicController::class, 'adminAboutSave']);
        // Messages de contact
        Route::get('contacts',                [WebPublicController::class, 'adminContactsList']);
        Route::patch('contacts/{id}/read',    [WebPublicController::class, 'adminContactMarkRead']);
    });

    /*
    |--------------------------------------------------------------------------
    | Module Matériel Médical
    |--------------------------------------------------------------------------
    */
    // Équipements — routes spéciales avant apiResource
    Route::get('materiel-medical/equipements/stats',    [MatMedEquipementController::class, 'stats']);
    Route::get('materiel-medical/equipements/metadata', [MatMedEquipementController::class, 'metadata']);
    Route::apiResource('materiel-medical/equipements',  MatMedEquipementController::class)
        ->parameters(['materiel-medical/equipements' => 'equipement']);

    // Locations — routes spéciales avant apiResource
    Route::get('materiel-medical/locations/reporting',                   [MatMedLocationController::class, 'reporting']);
    Route::get('materiel-medical/locations/historique/{equipementId}',   [MatMedLocationController::class, 'historiqueEquipement']);
    Route::post('materiel-medical/locations/{location}/diagnostic',      [MatMedLocationController::class, 'ajouterDiagnostic']);
    Route::post('materiel-medical/locations/{location}/acompte',         [MatMedLocationController::class, 'encaisserAcompte']);
    Route::post('materiel-medical/locations/{location}/cloturer',        [MatMedLocationController::class, 'cloturerDossier']);
    Route::apiResource('materiel-medical/locations',                     MatMedLocationController::class)
        ->parameters(['materiel-medical/locations' => 'location'])
        ->only(['index', 'show', 'store']);

});
