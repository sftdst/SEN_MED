<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_assessments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('dossier_id')->unsigned();
            $table->string('type_echelle'); // chute, doloplus, norton, mna
            $table->date('date_evaluation');
            $table->json('reponses');           // les réponses de l'évaluation
            $table->decimal('score', 5, 2);
            $table->decimal('score_max', 5, 2);
            $table->string('interpretation')->nullable(); // ex: "Risque important"
            $table->bigInteger('infirmiere_id')->nullable();
            $table->timestamps();

            $table->foreign('dossier_id')
                  ->references('id')
                  ->on('nursing_dossiers')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nursing_assessments');
    }
};
