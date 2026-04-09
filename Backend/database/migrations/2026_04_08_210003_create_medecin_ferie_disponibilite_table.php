<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medecin_ferie_disponibilite', function (Blueprint $table) {
            $table->bigIncrements('IDmedecin_ferie');
            $table->unsignedBigInteger('IDMedecin');
            $table->date('DateFerie');
            $table->time('HeureDebut')->nullable();
            $table->time('HeureFin')->nullable();
            $table->integer('DureeConsultation')->default(20);
            $table->integer('Statut')->default(1);
            $table->timestamps();

            $table->foreign('IDMedecin')
                  ->references('id')
                  ->on('hr_mst_user')
                  ->cascadeOnDelete();

            $table->foreign('DateFerie')
                  ->references('DateFerie')
                  ->on('jours_feries')
                  ->cascadeOnDelete();

            $table->index(['IDMedecin', 'DateFerie']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medecin_ferie_disponibilite');
    }
};
