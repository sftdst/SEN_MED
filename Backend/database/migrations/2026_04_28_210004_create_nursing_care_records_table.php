<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_care_records', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('dossier_id')->unsigned();
            $table->date('date_soin');
            $table->string('soin_category'); // role_propre, prescription
            $table->string('soin_label');    // Toilette, Change, etc.
            $table->string('periode');       // matin, soir, 8h, 12h, 16h, 19h
            $table->boolean('realise')->default(false);
            $table->text('note')->nullable();
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
        Schema::dropIfExists('nursing_care_records');
    }
};
