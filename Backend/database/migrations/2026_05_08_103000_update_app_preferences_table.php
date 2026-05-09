<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_preferences', function (Blueprint $table) {
            if (!Schema::hasColumn('app_preferences', 'logo_url'))
                $table->string('logo_url', 500)->nullable()->after('default_page');
            if (!Schema::hasColumn('app_preferences', 'phone'))
                $table->string('phone', 30)->default('+221 33 000 00 00')->after('logo_url');
            if (!Schema::hasColumn('app_preferences', 'email'))
                $table->string('email', 100)->default('contact@senmed.sn')->after('phone');
            if (!Schema::hasColumn('app_preferences', 'address'))
                $table->string('address', 300)->default('Dakar, Senegal')->after('email');
            if (!Schema::hasColumn('app_preferences', 'map_url'))
                $table->string('map_url', 500)->nullable()->after('address');
            if (!Schema::hasColumn('app_preferences', 'hours'))
                $table->string('hours', 100)->default('Lun - Sam : 08h00 - 18h00')->after('map_url');
        });
    }

    public function down(): void
    {
        Schema::table('app_preferences', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'phone', 'email', 'address', 'map_url', 'hours']);
        });
    }
};