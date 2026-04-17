<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ph_mst_commande', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->string('numero_commande', 50)->unique();
            $table->unsignedBigInteger('fournisseur_id')->nullable();
            $table->date('date_commande');
            $table->date('date_livration_prevue')->nullable();
            $table->string('statut', 20)->default('en_attente');
            $table->decimal('montant_total', 12, 2)->default(0);
            $table->text('observations')->nullable();
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->timestamps();

            $table->index('fournisseur_id', 'WDIDX_ph_mst_commande_fournisseur');
            $table->index('statut', 'WDIDX_ph_mst_commande_statut');
        });

        Schema::create('ph_mst_approvisionnement', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->unsignedBigInteger('commande_id')->nullable();
            $table->unsignedBigInteger('fournisseur_id')->nullable();
            $table->date('date_approvisionnement');
            $table->string('type', 30)->default('commande');
            $table->decimal('montant_total', 12, 2)->default(0);
            $table->text('observations')->nullable();
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->timestamps();

            $table->index('commande_id', 'WDIDX_ph_mst_approvisionnement_commande');
            $table->index('fournisseur_id', 'WDIDX_ph_mst_approvisionnement_fournisseur');
        });

        Schema::create('ph_mst_mouvement_stock', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->unsignedBigInteger('item_id');
            $table->string('type_mouvement', 20);
            $table->decimal('quantite', 10, 2);
            $table->decimal('stock_avant', 10, 2)->default(0);
            $table->decimal('stock_apres', 10, 2)->default(0);
            $table->decimal('prix_unitaire', 12, 2)->default(0);
            $table->string('motif', 100)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->timestamps();

            $table->index('item_id', 'WDIDX_ph_mst_mouvement_item');
            $table->index('type_mouvement', 'WDIDX_ph_mst_mouvement_type');
        });

        Schema::create('ph_mst_inventaire', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->string('numero_inventaire', 50)->unique();
            $table->date('date_inventaire');
            $table->date('date_fin')->nullable();
            $table->string('statut', 20)->default('en_cours');
            $table->text('observations')->nullable();
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->timestamps();

            $table->index('statut', 'WDIDX_ph_mst_inventaire_statut');
        });

        Schema::create('ph_mst_inventaire_detail', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->unsignedBigInteger('inventaire_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('stock_theorique', 10, 2)->default(0);
            $table->decimal('stock_physique', 10, 2)->default(0);
            $table->decimal('ecart', 10, 2)->default(0);
            $table->text('observation')->nullable();
            $table->timestamps();

            $table->index('inventaire_id', 'WDIDX_ph_mst_inventaire_detail_inventaire');
            $table->index('item_id', 'WDIDX_ph_mst_inventaire_detail_item');
        });

        Schema::create('ph_mst_stock', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->unsignedBigInteger('item_id')->unique();
            $table->decimal('quantite', 10, 2)->default(0);
            $table->decimal('seuil_alerte', 10, 2)->default(10);
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->timestamps();

            $table->index('item_id', 'WDIDX_ph_mst_stock_item');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ph_mst_inventaire_detail');
        Schema::dropIfExists('ph_mst_inventaire');
        Schema::dropIfExists('ph_mst_mouvement_stock');
        Schema::dropIfExists('ph_mst_approvisionnement');
        Schema::dropIfExists('ph_mst_commande');
    }
};