<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mm_mst_equipement', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 200);
            $table->string('categorie', 100)->nullable();
            $table->text('description')->nullable();
            $table->string('numero_serie', 100)->nullable();
            $table->string('modele', 100)->nullable();
            $table->string('reference', 100)->nullable();
            $table->string('nom_fournisseur', 200)->nullable();
            $table->decimal('prix_achat', 12, 2)->default(0);
            $table->decimal('prix_location', 12, 2)->default(0);
            $table->integer('stock_disponible')->default(0);
            $table->integer('stock_en_location')->default(0);
            $table->string('statut', 20)->default('actif'); // actif / inactif
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mm_mst_equipement');
    }
};
