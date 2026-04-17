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
<<<<<<< HEAD
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\CommandeController;
use App\Http\Controllers\Api\ApprovisionnementController;
use App\Http\Controllers\Api\MouvementStockController;
use App\Http\Controllers\Api\InventaireController;
=======
use App\Http\Controllers\Api\TransfertController;
use App\Http\Controllers\Api\FicheAttController;
use App\Http\Controllers\Api\ComptabiliteController;
use App\Http\Controllers\Api\PaiementController;
>>>>>>> d8c4da337df1efa248b2dd875d85ff287cbf2cbb

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Gestion de l'Organisation - SenMed
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

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

});
