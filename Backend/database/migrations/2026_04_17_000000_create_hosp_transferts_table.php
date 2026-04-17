<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosp_transferts', function (Blueprint $table) {
            $table->id('id_transfert');

            $table->string('patient_id', 50);
            $table->foreign('patient_id')
                  ->references('patient_id')
                  ->on('gen_mst_patient')
                  ->cascadeOnDelete();

            $table->enum('type_transfert', ['INTERNE', 'EXTERNE']);
            $table->timestamp('date_transfert');

            // ── Transfert interne ─────────────────────────────────────────────
            $table->unsignedBigInteger('ancien_medecin_id')->nullable();
            $table->unsignedBigInteger('nouveau_medecin_id')->nullable();
            $table->unsignedBigInteger('ancien_service_id')->nullable();
            $table->unsignedBigInteger('nouveau_service_id')->nullable();
            $table->unsignedBigInteger('ancienne_chambre_id')->nullable();
            $table->unsignedBigInteger('nouvelle_chambre_id')->nullable();

            $table->foreign('ancien_medecin_id')->references('id')->on('hr_mst_user')->nullOnDelete();
            $table->foreign('nouveau_medecin_id')->references('id')->on('hr_mst_user')->nullOnDelete();
            $table->foreign('ancien_service_id')->references('id_service')->on('gen_mst_service')->nullOnDelete();
            $table->foreign('nouveau_service_id')->references('id_service')->on('gen_mst_service')->nullOnDelete();
            $table->foreign('ancienne_chambre_id')->references('id_chambre')->on('hosp_chambres')->nullOnDelete();
            $table->foreign('nouvelle_chambre_id')->references('id_chambre')->on('hosp_chambres')->nullOnDelete();

            // ── Transfert externe ─────────────────────────────────────────────
            $table->string('structure_destination', 150)->nullable();
            $table->string('medecin_destination', 150)->nullable();
            $table->text('commentaire')->nullable();

            // ── Commun ────────────────────────────────────────────────────────
            $table->text('motif');
            $table->enum('statut', ['EN_COURS', 'VALIDE', 'ANNULE'])->default('EN_COURS');
            $table->string('created_user_id', 20)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosp_transferts');
    }
};
