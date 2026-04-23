<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Traitements chroniques / de longue durée du patient.
     * Mappé sur Mclinic_txn_long_term_medication.
     */
    public function up(): void
    {
        Schema::create('clinic_txn_long_term_medication', function (Blueprint $table) {
            $table->id('medication_id');
            $table->string('patient_id', 20)->nullable()->index();

            // Produit
            $table->string('item_id', 50)->nullable();
            $table->string('item_name', 200)->nullable();

            // Durée de traitement
            $table->date('med_start_date')->nullable();
            $table->date('med_end_date')->nullable();
            $table->smallInteger('duration')->nullable();
            $table->string('duration_type', 20)->nullable();    // jour/semaine/mois

            // Modalités de prise
            $table->string('usage', 50)->nullable();            // avant/après repas…
            $table->string('food_type', 50)->nullable();

            // Notes et statut
            $table->text('doctor_notes')->nullable();
            $table->integer('status_id')->default(1);           // 1=actif, 0=terminé/arrêté

            $table->string('created_user_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_txn_long_term_medication');
    }
};
