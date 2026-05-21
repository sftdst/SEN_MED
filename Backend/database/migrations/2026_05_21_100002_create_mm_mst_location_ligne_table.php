<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mm_mst_location_ligne', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('dossier_id');
            $table->unsignedBigInteger('equipement_id');
            $table->integer('quantite')->default(1);
            $table->decimal('prix_unitaire_location', 12, 2)->default(0);
            $table->decimal('montant_ligne', 12, 2)->default(0);
            $table->timestamps();

            $table->foreign('dossier_id')
                  ->references('id')->on('mm_mst_dossier_location')
                  ->onDelete('cascade');
            $table->foreign('equipement_id')
                  ->references('id')->on('mm_mst_equipement')
                  ->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mm_mst_location_ligne');
    }
};
