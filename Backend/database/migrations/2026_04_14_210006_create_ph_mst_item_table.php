<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ph_mst_item', function (Blueprint $table) {
            $table->string('item_id', 20)->unique();
            $table->string('description', 255)->nullable();
            $table->integer('days')->nullable();
            $table->integer('default_qty')->nullable();
            $table->string('created_user_id', 20);
            $table->timestamp('created_dttm')->default(DB::raw("'1900-01-01 00:00:00'"));
            $table->integer('status_id')->nullable();
            $table->timestamp('modified_dttm')->nullable();
            $table->smallInteger('duration')->default(0);
            $table->string('duration_type', 20)->nullable();
            $table->string('food_type', 20)->nullable();
            $table->string('vidal_id', 15)->nullable();
            $table->string('code_CpHa_id', 50)->nullable();
            $table->string('posologie', 50)->nullable();
            $table->integer('renew')->default(0);
            $table->integer('subustitution')->default(0);
            $table->integer('for_all_prescription')->default(0);
            $table->string('ucd', 50)->nullable();
            $table->string('voie_administration', 50)->nullable();
            $table->string('remarques', 50)->nullable();
            $table->string('preference_substitution', 50)->nullable();
            $table->string('midi', 50)->nullable();
            $table->string('soir', 50)->nullable();
            $table->string('couche', 50)->nullable();
            $table->integer('qty_vrac')->default(0);
            $table->integer('dddadulte')->default(0);
            $table->integer('dddpediatr')->default(0);
            $table->integer('max_prise')->default(0);
            $table->string('matin', 50)->nullable();
            $table->bigIncrements('id_Rep');
            $table->integer('prixcAchat')->default(0);
            $table->integer('PrixVente')->default(0);

            $table->index('created_user_id', 'WDIDX_ph_mst_item_created_user_id');
            $table->index('vidal_id', 'WDIDX_ph_mst_item_vidal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ph_mst_item');
    }
};
