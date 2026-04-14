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

    // CRUD visites
    Route::apiResource('visites', VisiteController::class)
        ->parameters(['visites' => 'visite'])
        ->only(['index', 'store', 'show']);

});
