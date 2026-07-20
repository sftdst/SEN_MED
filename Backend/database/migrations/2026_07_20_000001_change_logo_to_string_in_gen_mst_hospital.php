<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE gen_mst_hospital MODIFY logo VARCHAR(500) NULL;');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE gen_mst_hospital MODIFY logo BLOB NULL;');
    }
};
