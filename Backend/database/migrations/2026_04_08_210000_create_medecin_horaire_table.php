<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medecin_horaire', function (Blueprint $table) {
            $table->bigIncrements('IDmedecin_horaire');
            $table->unsignedBigInteger('IDMedecin');
            $table->integer('JourSemaine');         // 1=Lundi ... 7=Dimanche
            $table->time('HeureDebut');
            $table->time('HeureFin');
            $table->integer('DureeConsultation')->default(20); // en minutes
            $table->integer('Statut')->default(1);
            $table->timestamps();

            $table->foreign('IDMedecin')
                  ->references('id')
                  ->on('hr_mst_user')
                  ->cascadeOnDelete();

            $table->index(['IDMedecin', 'JourSemaine']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medecin_horaire');
    }
};
