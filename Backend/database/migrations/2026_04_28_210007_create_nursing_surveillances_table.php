<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_surveillances', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('dossier_id')->unsigned();
            $table->string('type_surveillance'); // plaie, diabete
            $table->date('date_surveillance');
            $table->json('data');                 // données spécifiques au type
            $table->text('observations')->nullable();
            $table->bigInteger('infirmiere_id')->nullable();
            $table->timestamps();

            $table->foreign('dossier_id')
                  ->references('id')
                  ->on('nursing_dossiers')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nursing_surveillances');
    }
};
