<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Supprimer l'ancienne colonne string et recréer en tinyInteger
        Schema::table('clinic_txn_adt', function (Blueprint $table) {
            $table->dropColumn('doctor_seen');
        });

        Schema::table('clinic_txn_adt', function (Blueprint $table) {
            $table->tinyInteger('doctor_seen')->default(0)->after('created_dttm')
                ->comment('0 = En attente, 1 = Vu par le médecin');
        });
    }

    public function down(): void
    {
        Schema::table('clinic_txn_adt', function (Blueprint $table) {
            $table->dropColumn('doctor_seen');
        });

        Schema::table('clinic_txn_adt', function (Blueprint $table) {
            $table->string('doctor_seen', 200)->nullable()->after('created_dttm');
        });
    }
};
