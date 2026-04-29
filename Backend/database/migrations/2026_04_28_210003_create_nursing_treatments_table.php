<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_treatments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('dossier_id')->unsigned();
            $table->string('designation'); // nom médicament ou traitement
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->boolean('arret')->default(false);
            $table->boolean('matin')->default(false);
            $table->boolean('midi')->default(false);
            $table->boolean('soir')->default(false);
            $table->boolean('nuit')->default(false);
            $table->integer('ordre')->default(0);
            $table->timestamps();

            $table->foreign('dossier_id')
                  ->references('id')
                  ->on('nursing_dossiers')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nursing_treatments');
    }
};
