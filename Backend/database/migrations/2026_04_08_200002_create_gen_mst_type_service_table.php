<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_Type_Service', function (Blueprint $table) {
            $table->bigIncrements('IDgen_mst_Type_Service');
            $table->string('NomType', 50);
            $table->string('description', 200);
            $table->integer('status')->default(0);
            $table->unsignedBigInteger('IDgen_mst_Departement')->default(0);
            $table->foreign('IDgen_mst_Departement')
                  ->references('IDgen_mst_Departement')
                  ->on('gen_mst_Departement')
                  ->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_Type_Service');
    }
};
