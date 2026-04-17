<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ph_mst_fournisseur', function (Blueprint $table) {
            $table->id('id_Rep');
            $table->string('code', 50)->unique();
            $table->string('nom', 150);
            $table->string('pays', 100)->nullable()->default('Sénégal');
            $table->string('ville', 100)->nullable();
            $table->string('adresse', 255)->nullable();
            $table->string('code_postal', 20)->nullable();
            $table->string('telephone', 50)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('site_web', 150)->nullable();
            $table->string('nom_responsable', 150)->nullable();
            $table->string('tel_responsable', 50)->nullable();
            $table->string('monnaie', 10)->nullable()->default('FCFA');
            $table->string('swift', 50)->nullable();
            $table->string('iban', 50)->nullable();
            $table->string('numero_compte', 50)->nullable();
            $table->string('banque', 100)->nullable();
            $table->text('remarques')->nullable();
            $table->boolean('actif')->default(true);
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->timestamps();

            $table->index('code', 'WDIDX_ph_mst_fournisseur_code');
            $table->index('nom', 'WDIDX_ph_mst_fournisseur_nom');
            $table->index('email', 'WDIDX_ph_mst_fournisseur_email');
            $table->index('telephone', 'WDIDX_ph_mst_fournisseur_telephone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ph_mst_fournisseur');
    }
};
