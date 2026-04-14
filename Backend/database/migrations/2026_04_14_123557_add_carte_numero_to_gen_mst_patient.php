<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('gen_mst_patient', function (Blueprint $table) {
            if (!Schema::hasColumn('gen_mst_patient', 'carte_numero')) {
                $table->string('carte_numero', 50)->nullable()->after('photo');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gen_mst_patient', function (Blueprint $table) {
            $table->dropColumn('carte_numero');
        });
    }
};
