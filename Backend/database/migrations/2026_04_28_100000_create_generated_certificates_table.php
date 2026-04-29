<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generated_certificates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('adt_id');
            $table->unsignedBigInteger('template_id');
            $table->string('template_name');          // snapshot du nom au moment de la génération
            $table->string('generated_by')->nullable(); // user_id ou nom utilisateur
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamps();

            $table->index('adt_id');
            $table->index('template_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_certificates');
    }
};
