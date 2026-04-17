<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ph_mst_commande', function (Blueprint $table) {
            $table->string('type_commande', 50)->nullable()->after('observations');
            $table->string('lieu_reception', 150)->nullable()->after('type_commande');
        });
    }

    public function down(): void
    {
        Schema::table('ph_mst_commande', function (Blueprint $table) {
            $table->dropColumn(['type_commande', 'lieu_reception']);
        });
    }
};
