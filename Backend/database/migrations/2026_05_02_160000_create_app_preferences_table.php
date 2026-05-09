<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_preferences', function (Blueprint $table) {
            $table->id();
            $table->string('app_name', 100)->default('SenMed');
            $table->string('app_slogan', 200)->nullable();
            $table->string('app_initial', 5)->default('SM');
            $table->string('primary_color', 20)->default('#002f59');
            $table->string('accent_color', 20)->default('#ff7631');
            $table->string('theme_mode', 10)->default('light');
            $table->string('density', 15)->default('normal');
            $table->string('sidebar_default', 15)->default('expanded');
            $table->string('language', 5)->default('fr');
            $table->string('currency', 10)->default('FCFA');
            $table->string('date_format', 20)->default('DD/MM/YYYY');
            $table->string('default_page', 100)->default('/');
            $table->string('logo_url', 500)->nullable();
            $table->string('phone', 30)->default('+221 33 000 00 00');
            $table->string('email', 100)->default('contact@senmed.sn');
            $table->string('address', 300)->default('Dakar, Senegal');
            $table->string('map_url', 500)->nullable();
            $table->string('hours', 100)->default('Lun - Sam : 08h00 - 18h00');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_preferences');
    }
};
