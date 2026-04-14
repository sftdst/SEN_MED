<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_facture', function (Blueprint $table) {
            $table->id('IDgen_mst_facture');
            $table->string('NomDescription', 400)->nullable();
            $table->decimal('PrixService', 18, 3)->default(0);
            $table->string('IDService', 20)->nullable();
            $table->unsignedBigInteger('adt_id')->nullable();
            $table->string('patient_id', 20)->nullable();
            $table->decimal('MontantPayer', 18, 3)->default(0);
            $table->decimal('MontantRestant', 18, 3)->default(0);
            $table->string('compagny_id', 20)->nullable();
            $table->decimal('MontantTotalFacture', 18, 3)->default(0);
            $table->string('StatutPaiement', 20)->default('EN_ATTENTE');
            $table->timestamp('DateCreation')->useCurrent();
            $table->string('docteur_id', 20)->nullable();
            $table->decimal('MontantPartenaire', 18, 3)->default(0);
            $table->string('TypeService', 50)->nullable();
            $table->decimal('patient_payable', 18, 3)->default(0);
            $table->unsignedBigInteger('bill_id')->nullable();
            $table->string('ID_Procedure', 50)->nullable();
            $table->decimal('MontantpayerPartenaire', 18, 3)->default(0);

            $table->index('adt_id');
            $table->index('patient_id');
            $table->index('bill_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_facture');
    }
};
