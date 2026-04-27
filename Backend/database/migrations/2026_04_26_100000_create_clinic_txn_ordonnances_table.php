<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_txn_ordonnances', function (Blueprint $table) {
            $table->id('ordonnance_id');

            // Lien visite (unique : 1 ordonnance par visite)
            $table->unsignedBigInteger('adt_id')->unique()->index();

            // Patient
            $table->string('patient_id', 20)->nullable()->index();

            // Médecin prescripteur (user_id de gen_mst_personnel)
            $table->string('medecin_id', 20)->nullable()->index();

            // Contenu
            $table->longText('contenu_html');          // HTML riche (contentEditable)
            $table->text('contenu_texte')->nullable(); // Texte brut pour recherche

            // Statut
            $table->enum('statut', ['brouillon', 'validee', 'annulee'])->default('brouillon');

            // Horodatage métier
            $table->timestamp('date_prescription')->nullable();

            // Traçabilité
            $table->string('created_user_id', 20)->nullable();
            $table->string('hospital_id', 20)->nullable();
            $table->timestamps();

            $table->foreign('adt_id')
                  ->references('adt_id')
                  ->on('clinic_txn_adt')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_txn_ordonnances');
    }
};
