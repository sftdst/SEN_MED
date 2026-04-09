<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_mst_user', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('user_id', 20)->unique();
            $table->string('staff_name', 200);
            $table->integer('status_id')->default(0);
            $table->string('gender_id', 20);           // masculin | feminin
            $table->string('created_user_id', 20);
            $table->timestamp('created_dttm');
            $table->string('user_name', 100)->nullable();
            $table->timestamp('modified_dttm')->nullable();
            $table->string('email_adress', 200)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('staff_type', 20)->nullable();
            $table->string('contact_number', 15)->nullable();
            $table->string('specialization', 20)->nullable();
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->integer('nationality_id')->default(0);
            $table->string('address', 400)->nullable();
            $table->string('phone_number', 50)->nullable();
            $table->string('autre_adress', 50)->nullable();
            $table->string('email_pro', 50)->nullable();
            $table->date('Joining_date')->nullable();
            $table->date('End_of_service_date')->nullable();
            $table->string('city', 50)->nullable();
            $table->string('type_adresse', 50)->nullable();
            $table->string('code_postal', 50)->nullable();
            $table->string('ville_principal', 50)->nullable();
            $table->string('ville_secondaire', 50)->nullable();
            $table->string('ID_pro', 50)->nullable();
            $table->string('type_exercie', 50)->nullable();
            $table->string('secteur', 50)->nullable();
            $table->string('lieu_exercice', 50)->nullable();
            $table->string('country_id', 50)->nullable();
            $table->string('second_name', 50)->nullable();
            $table->string('groupe_sanguin', 50)->nullable();
            $table->integer('personnel')->default(0);
            $table->integer('consult')->default(0);
            $table->string('titre_id', 50)->nullable();
            $table->unsignedBigInteger('IDgen_mst_Departement')->default(0);
            $table->foreign('IDgen_mst_Departement')
                  ->references('IDgen_mst_Departement')
                  ->on('gen_mst_Departement')
                  ->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_mst_user');
    }
};
