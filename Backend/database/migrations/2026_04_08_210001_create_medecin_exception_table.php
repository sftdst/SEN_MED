<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medecin_exception', function (Blueprint $table) {
            $table->bigIncrements('IDmedecin_exception');
            $table->unsignedBigInteger('IDMedecin');
            $table->timestamp('DateDebut');
            $table->timestamp('DateFin');
            $table->string('Type', 50)->nullable();   // congé, maladie, mission, formation
            $table->text('Description')->nullable();
            $table->timestamps();

            $table->foreign('IDMedecin')
                  ->references('id')
                  ->on('hr_mst_user')
                  ->cascadeOnDelete();

            $table->index(['IDMedecin', 'DateDebut', 'DateFin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medecin_exception');
    }
};
