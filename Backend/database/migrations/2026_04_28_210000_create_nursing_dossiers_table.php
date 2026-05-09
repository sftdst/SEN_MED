<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_dossiers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('patient_id');
            $table->unsignedBigInteger('adt_id')->nullable();
            $table->bigInteger('hospital_id')->default(1);
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->string('statut')->default('en_cours'); // en_cours, termine
            $table->text('notes')->nullable();
            $table->bigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('patient_id')
                  ->references('patient_id')
                  ->on('gen_mst_patient')
                  ->onDelete('restrict');

            $table->foreign('adt_id')
                  ->references('adt_id')
                  ->on('clinic_txn_adt')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nursing_dossiers');
    }
};
