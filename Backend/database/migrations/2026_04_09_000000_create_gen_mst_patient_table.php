<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gen_mst_patient', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->string('patient_id', 20)->unique();
            $table->string('patient_code', 10)->nullable();
            $table->integer('patient_id_numeric')->default(0);
            
            // Identité
            $table->string('title_id', 20)->nullable();
            $table->string('first_name', 100)->nullable();
            $table->string('second_name', 50)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('patient_name', 200)->nullable();
            $table->string('gender_id', 20)->nullable();
            $table->timestamp('dob')->nullable();
            $table->string('lieu_naissance', 50)->nullable();
            $table->integer('age_patient')->default(0);
            $table->string('type_age', 50)->nullable();
            
            // Situation civile
            $table->string('marital_status_id', 20)->nullable();
            $table->string('marital_name', 50)->nullable();
            $table->string('civiity_id', 50)->nullable();
            $table->string('nationality_id', 20)->nullable();
            
            // Localisation
            $table->string('country', 100)->default('Sénégal');
            $table->string('city', 100)->nullable();
            $table->string('address', 400)->nullable();
            $table->string('address2', 400)->nullable();
            $table->string('postal_code', 10)->nullable();
            $table->string('residence', 50)->nullable();
            
            // Contact
            $table->string('contact_number', 15)->nullable();
            $table->string('mobile_number', 15)->nullable();
            $table->string('email_adress', 200)->nullable();
            $table->string('emergency_contact_name', 200)->nullable();
            $table->string('emergency_contact_number', 50)->nullable();
            
            // Famille
            $table->string('pere_name', 50)->nullable();
            $table->string('mere_name', 50)->nullable();
            $table->string('mere_last_name', 50)->nullable();
            $table->string('father_adop', 50)->nullable();
            $table->string('mother_adop', 50)->nullable();
            $table->string('family_id', 100)->nullable();
            $table->string('compte_famille', 50)->nullable();
            $table->string('codefamilla', 50)->nullable();
            $table->string('relation_type_id', 20)->nullable();
            $table->string('responsable', 50)->nullable();
            
            // Professionnel
            $table->string('profession', 100)->nullable();
            $table->string('fonctions', 50)->nullable();
            $table->string('emplos', 50)->nullable();
            $table->string('socite', 50)->nullable();
            $table->string('lieu_travail', 50)->nullable();
            $table->string('contrat_type', 50)->nullable();
            $table->string('staff_no', 100)->nullable();
            
            // Couverture
            $table->string('company_id', 20)->nullable();
            $table->string('type_couverture', 50)->nullable();
            $table->string('num_police', 50)->nullable();
            $table->date('validate')->nullable();
            
            // Médecin
            $table->string('family_doctor', 200)->nullable();
            $table->string('telmedcin', 50)->nullable();
            $table->string('email_medcin', 50)->nullable();
            
            // Données administratives
            $table->string('ssn_no', 100)->nullable();
            $table->decimal('pending_amount', 18, 3)->default(0);
            $table->integer('status_id')->nullable()->default(1);
            $table->string('habitual_ide', 50)->nullable();
            $table->string('sama_numero', 50)->nullable();
            $table->string('photo', 500)->nullable();
            $table->string('carte_numero', 50)->nullable();
            
            // Audit
            $table->string('created_user_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();
            $table->timestamp('modified_dttm')->nullable();
            $table->string('phone_adop', 50)->nullable();

            // Index
            $table->index('patient_id');
            $table->index('patient_code');
            $table->index('company_id');
            $table->index('created_dttm');
            $table->index('status_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gen_mst_patient');
    }
};
