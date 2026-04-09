<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_Departement', function (Blueprint $table) {
            $table->bigIncrements('IDgen_mst_Departement');
            $table->string('NomDepartement', 50);
            $table->string('description', 200);
            $table->integer('status')->default(0);
            $table->decimal('Hospital_id', 20, 0)->nullable();
            $table->foreign('Hospital_id')
                  ->references('Hospital_id')
                  ->on('gen_mst_hospital')
                  ->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_Departement');
    }
};
