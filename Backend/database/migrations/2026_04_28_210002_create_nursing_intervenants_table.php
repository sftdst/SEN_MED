<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_intervenants', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('dossier_id')->unsigned();
            // medecin_traitant, infirmiere, kinesitherapeute, pharmacie, laboratoire, specialiste, autre
            $table->string('type_intervenant');
            $table->string('nom')->nullable();
            $table->string('telephone')->nullable();
            $table->string('cabinet')->nullable();
            $table->timestamps();

            $table->foreign('dossier_id')
                  ->references('id')
                  ->on('nursing_dossiers')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nursing_intervenants');
    }
};
