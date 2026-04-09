<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gen_mst_hospital', function (Blueprint $table) {
            $table->bigIncrements('id_Rep');
            $table->decimal('Hospital_id', 20, 0)->unique()->nullable();
            $table->string('hospital_name', 50)->nullable();
            $table->string('short_name', 50)->nullable();
            $table->string('adress', 50)->nullable();
            $table->string('postal_code', 50)->nullable();
            $table->string('zip_code', 50)->nullable();
            $table->string('fax', 50)->nullable();
            $table->string('mobile_number', 50)->nullable();
            $table->string('contact_number', 50)->nullable();
            $table->string('email_address', 50)->nullable();
            $table->string('website', 50)->nullable();
            $table->integer('status_id')->default(0);
            $table->binary('logo')->nullable();
            $table->string('type_cabinet', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gen_mst_hospital');
    }
};
