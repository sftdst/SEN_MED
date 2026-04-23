<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Actes / procédures cliniques réalisés pendant une consultation.
     */
    public function up(): void
    {
        Schema::create('clinic_txn_procedures', function (Blueprint $table) {
            $table->id('procedure_id');
            $table->string('patient_id', 20)->nullable()->index();
            $table->unsignedBigInteger('adt_id')->nullable()->index();
            $table->string('hospital_id', 20)->nullable();

            // Identification de l'acte
            $table->string('procedure_code', 50)->nullable();
            $table->string('procedure_name', 200)->nullable();
            $table->string('procedure_type', 50)->nullable();   // ex: chirurgie, soins, imagerie

            // Détails
            $table->text('description')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->decimal('cost', 12, 2)->default(0);

            // Résultat
            $table->text('result')->nullable();
            $table->integer('status_id')->default(1);           // 1=prescrit, 2=réalisé, 0=annulé

            $table->string('created_user_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();

            $table->foreign('adt_id')->references('adt_id')->on('clinic_txn_adt')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_txn_procedures');
    }
};
