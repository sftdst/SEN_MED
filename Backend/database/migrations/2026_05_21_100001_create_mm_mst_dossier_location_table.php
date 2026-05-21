<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mm_mst_dossier_location', function (Blueprint $table) {
            $table->id();
            $table->string('numero_dossier', 50)->unique();
            $table->date('date_location');
            $table->date('date_retour_prevue');
            $table->date('date_retour_effective')->nullable();
            $table->string('client_nom', 100);
            $table->string('client_prenom', 100);
            $table->string('client_telephone', 20)->nullable();
            $table->string('client_piece_identite', 100)->nullable();
            $table->decimal('montant_total', 12, 2)->default(0);
            $table->decimal('acompte', 12, 2)->default(0);       // 50% versé
            $table->decimal('reliquat', 12, 2)->default(0);      // 50% restant
            $table->decimal('penalite', 12, 2)->default(0);      // dommages éventuels
            // en_attente_diagnostic | diagnostic_initial | en_cours | retour_en_cours | cloture | en_retard
            $table->string('statut', 40)->default('en_attente_diagnostic');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mm_mst_dossier_location');
    }
};
