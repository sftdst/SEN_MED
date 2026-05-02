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
        Schema::table('hr_mst_user', function (Blueprint $table) {
            $table->string('photo', 500)->nullable()->after('groupe_sanguin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hr_mst_user', function (Blueprint $table) {
            $table->dropColumn('photo');
        });
    }
};
