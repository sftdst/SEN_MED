<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('key')->unique()->comment('Clé technique du module');
            $table->string('label')->comment('Nom affiché du module');
            $table->string('group_label')->comment('Groupe d\'appartenance (ex: ACCUEIL)');
            $table->string('icon', 50)->nullable()->comment('Icône dans le menu');
            $table->text('description')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
