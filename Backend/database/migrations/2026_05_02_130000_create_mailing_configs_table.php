<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mailing_configs', function (Blueprint $table) {
            $table->id();
            $table->string('host')->default('');
            $table->unsignedSmallInteger('port')->default(587);
            $table->enum('encryption', ['none', 'ssl', 'tls'])->default('tls');
            $table->string('username')->nullable();
            $table->text('password')->nullable();      // chiffré avec encrypt()
            $table->string('from_name')->default('SenMed');
            $table->string('from_email')->default('');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mailing_configs');
    }
};
