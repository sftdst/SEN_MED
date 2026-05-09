<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_about', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200)->default('Qui sommes-nous ?');
            $table->text('content')->nullable();
            $table->string('stat_1_value', 50)->default('24/7');
            $table->string('stat_1_label', 100)->default('Orientation patient');
            $table->string('stat_2_value', 50)->default('+30');
            $table->string('stat_2_label', 100)->default('Services coordonnés');
            $table->string('stat_3_value', 50)->default('100%');
            $table->string('stat_3_label', 100)->default('Suivi structure');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_about');
    }
};