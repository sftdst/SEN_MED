<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_slides', function (Blueprint $table) {
            $table->id();
            $table->string('image_url', 500)->nullable();
            $table->string('banner_url', 500)->nullable();
            $table->string('title', 200)->default('Titre de la slide');
            $table->text('description')->nullable();
            $table->string('button_label', 100)->default('En savoir plus');
            $table->string('button_link', 200)->default('#');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_slides');
    }
};