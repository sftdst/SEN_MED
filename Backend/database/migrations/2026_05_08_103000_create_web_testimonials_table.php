<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 150);
            $table->string('role', 100)->default('Patient');
            $table->string('photo', 500)->nullable();
            $table->text('texte');
            $table->unsignedTinyInteger('note')->default(5);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_testimonials');
    }
};
