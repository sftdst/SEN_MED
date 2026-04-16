<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_medcin_tarif', function (Blueprint $table) {
            $table->bigIncrements('id');

            // Médecin (FK vers hr_mst_user.user_id)
            $table->string('medecin_id', 50)->index();

            // Service concerné
            $table->unsignedBigInteger('service_id')->index();

            // Tarif personnalisé du médecin (null = utiliser le tarif hôpital)
            $table->decimal('prix_service', 12, 2)->nullable()
                  ->comment('null = fallback tarif hôpital (gen_mst_service.valeur_cts)');

            // Majoration jour férié
            $table->decimal('majoration_ferie', 5, 2)->default(0)
                  ->comment('Valeur de majoration (% ou montant fixe)');
            $table->enum('type_majoration', ['pourcentage', 'montant_fixe'])
                  ->default('pourcentage')
                  ->comment('Type de la majoration férie');

            // Statut
            $table->boolean('actif')->default(true);

            // Note optionnelle
            $table->text('note')->nullable();

            $table->timestamps();

            // Unicité médecin × service
            $table->unique(['medecin_id', 'service_id'], 'uq_medcin_service');

            $table->foreign('service_id')
                  ->references('id_service')
                  ->on('gen_mst_service')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_medcin_tarif');
    }
};
