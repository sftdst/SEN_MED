<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_pages', function (Blueprint $table) {
            $table->id();
            $table->string('path', 200)->unique();
            $table->string('title', 200);
            $table->string('tag', 100)->nullable();
            $table->string('icon', 20)->nullable();
            $table->text('subtitle')->nullable();
            $table->text('description')->nullable();
            $table->json('features')->nullable();
            $table->json('steps')->nullable();
            $table->json('details')->nullable();
            $table->json('info')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_pages');
    }
};
