<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ph_mst_detail_commande', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->unsignedBigInteger('commande_id');
            $table->unsignedBigInteger('produit_id');
            $table->decimal('quantite', 10, 2)->default(0);
            $table->decimal('prix_achat', 18, 2)->default(0);
            $table->decimal('tva', 5, 2)->default(0);
            $table->decimal('montant_ht', 18, 2)->default(0);
            $table->decimal('montant_ttc', 18, 2)->default(0);
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->timestamps();

            $table->index('commande_id', 'WDIDX_ph_mst_detail_commande_cmd');
            $table->index('produit_id', 'WDIDX_ph_mst_detail_commande_produit');
            $table->foreign('commande_id')
                  ->references('id_Rep')->on('ph_mst_commande')
                  ->onDelete('cascade');
            $table->foreign('produit_id')
                  ->references('id_Rep')->on('ph_mst_item')
                  ->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ph_mst_detail_commande');
    }
};
