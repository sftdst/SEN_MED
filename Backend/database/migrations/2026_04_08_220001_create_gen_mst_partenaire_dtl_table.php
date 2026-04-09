<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_partenaire_dtl', function (Blueprint $table) {
            $table->bigIncrements('id_Rep');
            $table->string('id_partenaire_dtl', 50)->unique()->nullable();
            $table->string('Nom', 50)->nullable();
            $table->string('service', 50)->nullable();
            $table->integer('contributionCompagny')->default(0);   // Part Compagnie %
            $table->integer('contributionPatient')->default(0);    // Part Patient %
            $table->integer('Maximum_Credit')->default(0);
            $table->integer('Pending_amount')->default(0);
            $table->integer('Paid_amount')->default(0);
            $table->string('Id_gen_partenaire', 50)->nullable();
            $table->timestamps();

            $table->foreign('Id_gen_partenaire')
                  ->references('id_gen_partenaire')
                  ->on('gen_mst_partenaire_header')
                  ->cascadeOnDelete();

            $table->index('Id_gen_partenaire', 'WDIDX_gen_mst_partenaire_dtl_Id_gen_partenaire');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_partenaire_dtl');
    }
};
