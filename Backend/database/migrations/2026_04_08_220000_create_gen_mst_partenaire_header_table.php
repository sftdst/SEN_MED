<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_partenaire_header', function (Blueprint $table) {
            $table->bigIncrements('id_Rep');
            $table->string('id_gen_partenaire', 50)->unique();
            $table->string('Nom', 50)->nullable();
            $table->string('pays', 50)->nullable();
            $table->string('ville', 50)->nullable();
            $table->string('adress', 50)->nullable();
            $table->string('contact', 50)->nullable();
            $table->string('mobile', 50)->nullable();
            $table->string('bank', 50)->nullable();
            $table->string('email', 50)->nullable();
            $table->string('type_societe', 50)->nullable();
            $table->string('numero_compte', 50)->nullable();
            $table->integer('maximum_credit')->default(0);
            $table->integer('pending_amount')->default(0);
            $table->integer('paid_amount')->default(0);
            $table->date('date_created')->nullable();
            $table->string('code_societe', 50)->unique()->nullable();
            $table->boolean('status')->default(false);
            $table->integer('TypePart')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_partenaire_header');
    }
};
