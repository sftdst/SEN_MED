<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_txn_bill_hd', function (Blueprint $table) {
            $table->id('bill_hd_id');
            $table->string('bill_no', 50)->nullable();
            $table->date('bill_date')->nullable();
            $table->string('patient_id', 20)->nullable();
            $table->decimal('bill_amount', 18, 3)->default(0);
            $table->decimal('discount_amount', 18, 3)->default(0);
            $table->decimal('net_amount', 18, 3)->default(0);
            $table->string('card_no', 50)->nullable();
            $table->string('cheque_no', 50)->nullable();
            $table->date('cheque_date')->nullable();
            $table->timestamp('created_dttm')->useCurrent();
            $table->string('created_user_id', 20)->nullable();
            $table->integer('bill_status_id')->default(1);
            $table->string('cancelled_user_id', 20)->nullable();
            $table->string('cancelled_remarks', 400)->nullable();
            $table->decimal('paid_amount', 18, 3)->default(0);
            $table->decimal('pending_amount', 18, 3)->default(0);
            $table->decimal('card_amount', 18, 3)->default(0);
            $table->decimal('cash_amount', 18, 3)->default(0);
            $table->decimal('cheque_amount', 18, 3)->default(0);
            $table->string('bank_id', 20)->nullable();
            $table->string('mode_paye', 50)->nullable();
            $table->string('status_monaie', 20)->nullable();
            $table->decimal('mont_monaie', 18, 3)->default(0);
            $table->decimal('mont_recu', 18, 3)->default(0);
            $table->bigInteger('bill_id_numeric')->default(0);
            $table->unsignedBigInteger('adt_id')->nullable();
            $table->decimal('montant_mobile', 18, 3)->default(0);
            $table->string('telephone', 20)->nullable();
            $table->string('operateur_mobil', 50)->nullable();
            $table->decimal('mon_remb', 18, 3)->default(0);

            $table->index('patient_id');
            $table->index('adt_id');
            $table->index('created_dttm');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_txn_bill_hd');
    }
};
