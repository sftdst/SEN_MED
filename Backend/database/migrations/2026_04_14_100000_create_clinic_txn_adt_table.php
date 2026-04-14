<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_txn_adt', function (Blueprint $table) {
            $table->id('adt_id');
            $table->string('patient_pin', 20)->nullable();          // patient_id de gen_mst_patient
            $table->timestamp('visit_datetime')->useCurrent();
            $table->string('consulting_doctor_id', 20)->nullable(); // personnel_id du médecin
            $table->string('visit_type', 50)->nullable();
            $table->string('hospital_id', 20)->nullable();
            $table->string('created_user_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();
            $table->string('doctor_seen', 200)->nullable();
            $table->decimal('bill_amount', 18, 3)->default(0);

            // Référence
            $table->string('refered_doctor', 200)->nullable();
            $table->string('refered_hospital', 200)->nullable();
            $table->string('numero_medcin', 50)->nullable();

            // Lieu du RDV
            $table->string('visit_place', 100)->nullable();

            // Assurance
            $table->string('ID_Compagny', 20)->nullable();
            $table->string('ID_TypeCouverture', 50)->nullable();

            // Checkboxes
            $table->boolean('prise_en_charge')->default(false);
            $table->boolean('contrat_pol')->default(false);
            $table->boolean('attestation')->default(false);

            // Autres infos
            $table->string('societe', 100)->nullable();
            $table->string('ref_pc', 50)->nullable();
            $table->date('date')->nullable();
            $table->string('Lien_Parente', 50)->nullable();
            $table->boolean('urgence')->default(false);
            $table->boolean('Hospitaliser')->default(false);
            $table->string('IDgen_mst_Departement', 20)->nullable();

            // Totaux
            $table->decimal('Total_a_payer', 18, 3)->default(0);
            $table->decimal('montant_patient', 18, 3)->default(0);
            $table->decimal('montant_compagny', 18, 3)->default(0);

            $table->index('patient_pin');
            $table->index('consulting_doctor_id');
            $table->index('created_dttm');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_txn_adt');
    }
};
