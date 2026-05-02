<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('nursing_treatments', function (Blueprint $table) {
            $table->string('item_id', 50)->nullable()->after('designation');       // référence ph_mst_item.item_id
            $table->string('item_ref', 20)->nullable()->after('item_id');          // id_Rep ph_mst_item
            $table->integer('quantite')->default(1)->after('item_ref');
            $table->decimal('prix_unitaire', 12, 2)->nullable()->after('quantite');
            $table->decimal('prix_total', 12, 2)->nullable()->after('prix_unitaire');
            $table->bigInteger('facturation_id')->nullable()->after('prix_total'); // gen_mst_facture.id
            $table->string('posologie', 200)->nullable()->after('facturation_id');
        });
    }

    public function down(): void
    {
        Schema::table('nursing_treatments', function (Blueprint $table) {
            $table->dropColumn(['item_id', 'item_ref', 'quantite', 'prix_unitaire', 'prix_total', 'facturation_id', 'posologie']);
        });
    }
};
