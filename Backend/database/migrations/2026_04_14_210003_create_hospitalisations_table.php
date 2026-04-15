<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosp_hospitalisations', function (Blueprint $table) {
            $table->id('id_hospitalisation');
            $table->string('patient_id', 20);
            $table->unsignedBigInteger('id_chambre');
            $table->string('medecin_id', 20)->nullable();
            $table->date('date_entree');
            $table->date('date_sortie_prevue')->nullable();
            $table->date('date_sortie_reelle')->nullable();
            $table->text('motif')->nullable();
            $table->string('statut', 30)->default('En cours'); // En cours / Terminée / Annulée
            $table->string('created_user_id', 20)->nullable();
            $table->timestamps();

            $table->foreign('id_chambre')->references('id_chambre')->on('hosp_chambres');
            $table->index('patient_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosp_hospitalisations');
    }
};
