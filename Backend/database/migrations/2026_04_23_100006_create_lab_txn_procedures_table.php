<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Examens de laboratoire prescrits / réalisés lors d'une consultation.
     */
    public function up(): void
    {
        Schema::create('lab_txn_procedures', function (Blueprint $table) {
            $table->id('lab_procedure_id');
            $table->string('patient_id', 20)->nullable()->index();
            $table->unsignedBigInteger('adt_id')->nullable()->index();
            $table->string('hospital_id', 20)->nullable();

            // Identification du test
            $table->string('lab_test_code', 50)->nullable();
            $table->string('lab_test_name', 200)->nullable();
            $table->string('lab_category', 100)->nullable();    // Hématologie, Biochimie…

            // Résultat
            $table->text('result')->nullable();
            $table->string('unit', 50)->nullable();             // mg/dL, UI/L…
            $table->string('normal_range', 100)->nullable();    // ex: 70–110
            $table->string('result_status', 20)->nullable();    // normal / anormal / critique

            // Notes
            $table->text('doctor_notes')->nullable();
            $table->decimal('cost', 12, 2)->default(0);
            $table->integer('status_id')->default(1);           // 1=prescrit, 2=résultat reçu, 0=annulé

            $table->date('result_date')->nullable();
            $table->string('created_user_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();

            $table->foreign('adt_id')->references('adt_id')->on('clinic_txn_adt')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_txn_procedures');
    }
};
