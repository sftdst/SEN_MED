<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 150);
            $table->string('telephone', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('message')->nullable();
            $table->boolean('is_read')->default(false);
            $table->boolean('is_replied')->default(false);
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_contacts');
    }
};