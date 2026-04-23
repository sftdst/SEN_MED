<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_txn_adt_notes', function (Blueprint $table) {
            $table->id('adt_notes_id');
            $table->string('patient_id', 20)->nullable()->index();
            $table->unsignedBigInteger('adt_id')->nullable()->index();
            $table->text('adt_notes')->nullable();
            $table->string('created_user_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();
            $table->string('hospital_id', 20)->nullable();
            $table->integer('adt_note_template_id')->nullable();

            $table->foreign('adt_id')->references('adt_id')->on('clinic_txn_adt')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_txn_adt_notes');
    }
};
