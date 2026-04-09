<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_service', function (Blueprint $table) {
            $table->bigIncrements('id_service');
            $table->string('id_gen_mst_service', 50)->unique()->nullable();
            $table->string('n_ordre', 50)->nullable();
            $table->string('short_name', 50)->nullable();
            $table->string('tri_name', 50)->nullable();
            $table->string('code_local', 50)->nullable();
            $table->string('cle_tarif_service', 50)->nullable();
            $table->string('groupe_id', 50)->nullable();
            $table->string('categorie_id', 50)->nullable();
            $table->string('type_categorie', 50)->nullable();
            $table->integer('status')->default(0);
            $table->string('valeur_cts', 50)->nullable();
            $table->string('majoration_ferie', 50)->nullable();
            $table->string('code_snomed', 50)->nullable();
            $table->string('code_hl7', 50)->nullable();
            $table->unsignedBigInteger('IDgen_mst_Type_Service')->nullable();
            $table->foreign('IDgen_mst_Type_Service')
                  ->references('IDgen_mst_Type_Service')
                  ->on('gen_mst_Type_Service')
                  ->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_service');
    }
};
