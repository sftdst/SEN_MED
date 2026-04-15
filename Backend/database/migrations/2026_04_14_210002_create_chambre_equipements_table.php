<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosp_chambre_equipements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_chambre');
            $table->unsignedBigInteger('id_equipement');
            $table->unsignedSmallInteger('quantite')->default(1);
            $table->string('etat', 30)->default('Fonctionnel'); // Fonctionnel / En panne
            $table->timestamps();

            $table->foreign('id_chambre')->references('id_chambre')->on('hosp_chambres')->onDelete('cascade');
            $table->foreign('id_equipement')->references('id_equipement')->on('hosp_equipements')->onDelete('cascade');
            $table->unique(['id_chambre', 'id_equipement']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosp_chambre_equipements');
    }
};
