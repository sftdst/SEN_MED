<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosp_fiches_att', function (Blueprint $table) {
            $table->id('id_fiche');
            $table->string('patient_id', 20);
            $table->unsignedBigInteger('adt_id')->nullable();
            $table->string('nom_fichier', 255);
            $table->string('chemin', 500);
            $table->string('type_mime', 100);
            $table->string('extension', 10);
            $table->unsignedBigInteger('taille')->default(0);
            $table->string('categorie', 50)->default('EXAMEN');
            $table->text('description')->nullable();
            $table->string('source', 20)->default('UPLOAD'); // UPLOAD | WEBCAM
            $table->string('created_user_id', 50)->nullable();
            $table->timestamps();

            $table->index('patient_id');
            $table->index('adt_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosp_fiches_att');
    }
};
