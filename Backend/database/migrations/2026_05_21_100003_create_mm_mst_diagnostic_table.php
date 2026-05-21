<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mm_mst_diagnostic', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('dossier_id');
            $table->string('type_diagnostic', 20); // initial / retour
            $table->string('etat_general', 20);    // bon / moyen / mauvais
            $table->text('observations')->nullable();
            $table->string('signataire', 200)->nullable();
            $table->timestamp('date_diagnostic')->nullable();
            $table->timestamps();

            $table->foreign('dossier_id')
                  ->references('id')->on('mm_mst_dossier_location')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mm_mst_diagnostic');
    }
};
