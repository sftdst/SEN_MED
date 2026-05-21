<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_recette', function (Blueprint $table) {
            $table->id();
            $table->string('source', 50);            // 'materiel_medical', 'pharmacie', etc.
            $table->unsignedBigInteger('source_id')->nullable(); // id dans la table source
            $table->string('reference', 100)->nullable();
            $table->string('libelle', 255);
            $table->decimal('montant', 12, 2);
            $table->date('date_recette');
            $table->string('type_paiement', 50)->nullable(); // acompte, reliquat, penalite
            $table->string('client_nom', 200)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_recette');
    }
};
