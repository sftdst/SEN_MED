<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosp_factures', function (Blueprint $table) {
            $table->id('id_facture');
            $table->unsignedBigInteger('id_hospitalisation');
            $table->integer('nb_jours')->default(0);
            $table->decimal('prix_journalier', 18, 2)->default(0);
            $table->decimal('montant_hebergement', 18, 2)->default(0);
            $table->decimal('montant_soins', 18, 2)->default(0);
            $table->decimal('montant_total', 18, 2)->default(0);
            $table->decimal('montant_paye', 18, 2)->default(0);
            $table->decimal('montant_restant', 18, 2)->default(0);
            $table->string('statut_paiement', 30)->default('EN_ATTENTE'); // EN_ATTENTE / PARTIEL / PAYE
            $table->date('date_facture');
            $table->string('created_user_id', 20)->nullable();
            $table->timestamps();

            $table->foreign('id_hospitalisation')->references('id_hospitalisation')->on('hosp_hospitalisations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosp_factures');
    }
};
