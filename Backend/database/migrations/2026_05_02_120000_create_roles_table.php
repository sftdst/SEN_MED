<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->unique()->comment('Nom du profil/ rôle');
            $table->string('key')->unique()->comment('Clé technique du rôle');
            $table->string('icon', 50)->nullable()->comment('Icône pour l\'interface');
            $table->string('color', 20)->nullable()->comment('Couleur dans l\'interface');
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false)->comment('Rôle système non supprimable');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
