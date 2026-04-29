<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_transmissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('dossier_id')->unsigned();
            $table->string('type_transmission'); // observation, dar
            $table->date('date_transmission');
            $table->string('cible')->nullable();       // pour DAR
            $table->string('dar_category')->nullable(); // D, A, R
            $table->text('contenu');
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
        Schema::dropIfExists('nursing_transmissions');
    }
};
