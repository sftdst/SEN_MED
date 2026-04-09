<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jours_feries', function (Blueprint $table) {
            $table->bigIncrements('IDjour_ferie');
            $table->date('DateFerie')->unique();
            $table->string('Libelle', 100)->nullable();
            $table->integer('Statut')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jours_feries');
    }
};
