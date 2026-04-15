<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_txn_appointments', function (Blueprint $table) {
            $table->string('appointment_id', 20)->unique();
            $table->string('patient_id', 20);
            $table->timestamp('appointment_date')->nullable();
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->integer('status_id')->nullable();
            $table->string('created_user_id', 20);
            $table->timestamp('created_dttm')->default(DB::raw("'1900-01-01 00:00:00'"));
            $table->string('consulting_doctor_id', 20)->nullable();
            $table->string('remarks', 255)->nullable();
            $table->string('appointment_type', 20)->nullable();
            $table->string('patient_type', 20)->nullable();
            $table->string('appointment_brush_color', 100)->nullable();
            $table->string('visit_place', 20)->nullable();
            $table->string('email', 50)->nullable();
            $table->string('telephone', 50)->nullable();
            $table->date('date_naissance')->nullable();
            $table->string('sexe', 50)->nullable();
            $table->string('raison_motif', 50)->nullable();
            $table->string('etiologie', 50)->nullable();
            $table->string('age_patient', 50)->nullable();
            $table->string('referal_partner', 50)->nullable();
            $table->string('obs_annule_report', 50)->nullable();
            $table->string('motif_annule_report', 50)->nullable();
            $table->integer('statut_app')->default(0);
            $table->string('personne_pris', 50)->nullable();
            $table->string('nom_personne', 50)->nullable();
            $table->string('tel_personnepris', 50)->nullable();
            $table->string('lien_parente', 50)->nullable();
            $table->string('email_patient', 50)->nullable();
            $table->bigIncrements('id_Rep');

            $table->index('patient_id', 'WDIDX_app_txn_appointments_patient_id');
            $table->index('created_user_id', 'WDIDX_app_txn_appointments_created_user_id');
            $table->index('appointment_type', 'WDIDX_app_txn_appointments_appointment_type');
            $table->index('patient_type', 'WDIDX_app_txn_appointments_patient_type');
            $table->index('appointment_brush_color', 'WDIDX_app_txn_appointments_appointment_brush_color');
            $table->index('visit_place', 'WDIDX_app_txn_appointments_visit_place');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_txn_appointments');
    }
};
