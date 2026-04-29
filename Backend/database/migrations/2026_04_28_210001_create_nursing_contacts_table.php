<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_contacts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('dossier_id')->unsigned();
            $table->string('nom');
            $table->string('qualite')->nullable();
            $table->string('telephone')->nullable();
            $table->integer('ordre')->default(1); // 1 or 2
            $table->timestamps();

            $table->foreign('dossier_id')
                  ->references('id')
                  ->on('nursing_dossiers')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nursing_contacts');
    }
};
