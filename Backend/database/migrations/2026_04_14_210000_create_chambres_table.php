<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosp_chambres', function (Blueprint $table) {
            $table->id('id_chambre');
            $table->string('code_chambre', 20)->unique();
            $table->string('nom', 100);
            $table->string('type', 50)->default('Standard'); // Standard / VIP / Réanimation / Maternité
            $table->decimal('prix_journalier', 18, 2)->default(0);
            $table->unsignedSmallInteger('capacite')->default(1);
            $table->string('statut', 30)->default('Disponible'); // Disponible / Occupée / Maintenance / À nettoyer
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('statut');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosp_chambres');
    }
};
