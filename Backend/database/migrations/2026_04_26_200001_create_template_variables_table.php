<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_variables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hospital_id')->nullable()->index();
            $table->string('variable_name', 100)->unique(); // ex: adresse_du_patient
            $table->string('label', 200);                   // Libellé affiché dans la liste
            $table->boolean('is_system')->default(false);   // Variable système (non supprimable)
            $table->timestamps();
        });

        // Variables système prédéfinies
        $systemVars = [
            ['variable_name' => 'adresse_du_patient',        'label' => 'Adresse du patient',          'is_system' => true],
            ['variable_name' => 'age_du_patient',            'label' => 'Âge du patient',              'is_system' => true],
            ['variable_name' => 'autre_prenom_du_patient',   'label' => 'Autre prénom du patient',     'is_system' => true],
            ['variable_name' => 'civilite_du_medecin',       'label' => 'Civilité du médecin référent','is_system' => true],
            ['variable_name' => 'civilite_du_patient',       'label' => 'Civilité du patient',         'is_system' => true],
            ['variable_name' => 'civilite_du_praticien',     'label' => 'Civilité du praticien',       'is_system' => true],
            ['variable_name' => 'consequence_a_partir_du',   'label' => 'Conséquence à partir du',     'is_system' => true],
            ['variable_name' => 'consequences_jusqu_au',     'label' => 'Conséquences jusqu\'au',      'is_system' => true],
            ['variable_name' => 'date_de_l_evenement',       'label' => "Date de l'évènement",         'is_system' => true],
            ['variable_name' => 'date_de_naissance_du_patient','label' => 'Date de naissance du patient','is_system' => true],
            ['variable_name' => 'date_du_service',           'label' => 'Date du service',             'is_system' => true],
            ['variable_name' => 'date_edition',              'label' => "Date d'édition",              'is_system' => true],
            ['variable_name' => 'doctor',                    'label' => 'Médecin (Doctor)',             'is_system' => true],
            ['variable_name' => 'emploi_du_patient',         'label' => 'Emploi du patient',           'is_system' => true],
            ['variable_name' => 'evenement_responsable',     'label' => 'Évènement responsable',       'is_system' => true],
            ['variable_name' => 'nom_du_patient',            'label' => 'Nom du patient',              'is_system' => true],
            ['variable_name' => 'prenom_du_patient',         'label' => 'Prénom du patient',           'is_system' => true],
            ['variable_name' => 'sexe_du_patient',           'label' => 'Sexe du patient',             'is_system' => true],
            ['variable_name' => 'telephone_du_patient',      'label' => 'Téléphone du patient',        'is_system' => true],
            ['variable_name' => 'nom_hopital',               'label' => "Nom de l'hôpital",            'is_system' => true],
            ['variable_name' => 'adresse_hopital',           'label' => "Adresse de l'hôpital",        'is_system' => true],
            ['variable_name' => 'diagnostic',                'label' => 'Diagnostic',                  'is_system' => true],
            ['variable_name' => 'date_visite',               'label' => 'Date de la visite',           'is_system' => true],
        ];

        $now = now();
        foreach ($systemVars as &$v) {
            $v['created_at'] = $now;
            $v['updated_at'] = $now;
        }

        DB::table('template_variables')->insert($systemVars);
    }

    public function down(): void
    {
        Schema::dropIfExists('template_variables');
    }
};
