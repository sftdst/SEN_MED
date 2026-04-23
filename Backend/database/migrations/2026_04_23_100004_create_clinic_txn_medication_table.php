<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Prescriptions émises lors d'une consultation (ordonnance du jour).
     * Différent de clinic_txn_long_term_medication qui couvre le suivi chronique.
     */
    public function up(): void
    {
        Schema::create('clinic_txn_medication', function (Blueprint $table) {
            $table->id('medication_id');
            $table->string('patient_id', 20)->nullable()->index();
            $table->unsignedBigInteger('adt_id')->nullable()->index();
            $table->string('hospital_id', 20)->nullable();

            // Produit
            $table->string('item_id', 50)->nullable();
            $table->string('item_name', 200)->nullable();

            // Posologie
            $table->string('dosage', 100)->nullable();          // ex: "500mg"
            $table->string('frequency', 100)->nullable();       // ex: "3 fois/jour"
            $table->smallInteger('duration')->nullable();       // nombre
            $table->string('duration_type', 20)->nullable();    // jour/semaine/mois
            $table->string('usage', 50)->nullable();            // before/after/with
            $table->string('food_type', 50)->nullable();        // avant/après repas

            // Infos complémentaires
            $table->text('doctor_notes')->nullable();
            $table->integer('status_id')->default(1);           // 1=actif, 0=annulé

            $table->string('created_user_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();

            $table->foreign('adt_id')->references('adt_id')->on('clinic_txn_adt')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_txn_medication');
    }
};
