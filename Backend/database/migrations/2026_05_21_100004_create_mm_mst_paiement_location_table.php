<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mm_mst_paiement_location', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('dossier_id');
            $table->string('type_paiement', 30); // acompte / reliquat / penalite
            $table->decimal('montant', 12, 2);
            $table->timestamp('date_paiement')->useCurrent();
            $table->string('reference', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('dossier_id')
                  ->references('id')->on('mm_mst_dossier_location')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mm_mst_paiement_location');
    }
};
