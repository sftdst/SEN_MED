<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_txn_vital_sign', function (Blueprint $table) {
            $table->id('vital_sign_id');
            $table->string('patient_id', 20)->nullable()->index();
            $table->string('hospital_id', 20)->nullable();
            $table->unsignedBigInteger('adt_id')->nullable()->index();

            // Température
            $table->decimal('temperature_f', 5, 2)->nullable();
            $table->decimal('temperature_c', 5, 2)->nullable();

            // Pouls & respiration
            $table->decimal('pulse', 6, 2)->nullable();
            $table->decimal('respiration', 6, 2)->nullable();

            // Tension artérielle (droite / gauche)
            $table->decimal('bp_systolic_r', 6, 2)->nullable();
            $table->decimal('bp_diastolic_r', 6, 2)->nullable();
            $table->decimal('bp_systolic_l', 6, 2)->nullable();
            $table->decimal('bp_diastolic_l', 6, 2)->nullable();

            // Poids / taille / IMC
            $table->decimal('weights', 6, 2)->nullable();   // kg
            $table->decimal('height', 6, 2)->nullable();    // cm
            $table->decimal('bmi', 5, 2)->nullable();

            // Oxymétrie
            $table->decimal('spo_2', 5, 2)->nullable();

            $table->string('created_user_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();

            $table->foreign('adt_id')->references('adt_id')->on('clinic_txn_adt')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_txn_vital_sign');
    }
};
