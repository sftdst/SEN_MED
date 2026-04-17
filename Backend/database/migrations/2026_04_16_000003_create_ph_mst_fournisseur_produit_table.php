<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ph_mst_fournisseur_produit', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->unsignedBigInteger('fournisseur_id');
            $table->unsignedBigInteger('produit_id');
            $table->decimal('prix', 18, 2)->default(0);
            $table->string('devise', 10)->nullable()->default('FCFA');
            $table->integer('delai_livraison')->nullable()->comment('Nombre de jours');
            $table->integer('quantite_minimale')->nullable()->default(1);
            $table->decimal('remise', 5, 2)->nullable()->default(0)->comment('Pourcentage');
            $table->timestamps();

            $table->unique(['fournisseur_id', 'produit_id'], 'UNIQUE_fournisseur_produit');
            $table->index('fournisseur_id', 'WDIDX_fournisseur_produit_fournisseur');
            $table->index('produit_id', 'WDIDX_fournisseur_produit_produit');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ph_mst_fournisseur_produit');
    }
};