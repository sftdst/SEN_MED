<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doc_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hospital_id')->nullable()->index();
            $table->string('description', 255);          // Nom du modèle (affiché dans la liste)
            $table->string('header', 500)->nullable();   // En-tête imprimé sur le document
            $table->longText('content')->nullable();     // Contenu HTML avec {{variables}}
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doc_templates');
    }
};
