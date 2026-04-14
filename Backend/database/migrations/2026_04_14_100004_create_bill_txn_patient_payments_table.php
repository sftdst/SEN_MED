<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_txn_patient_payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->decimal('paid_amount', 18, 3)->default(0);
            $table->string('patient_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();
            $table->string('created_user_id', 20)->nullable();
            $table->string('hospital_id', 20)->nullable();
            $table->date('payment_date')->nullable();
            $table->decimal('total_amount', 18, 3)->default(0);
            $table->decimal('discount_amount', 18, 3)->default(0);
            $table->decimal('net_amount', 18, 3)->default(0);
            $table->decimal('cash_amount', 18, 3)->default(0);
            $table->decimal('card_amount', 18, 3)->default(0);
            $table->decimal('cheque_amount', 18, 3)->default(0);
            $table->string('card_no', 50)->nullable();
            $table->string('cheque_no', 50)->nullable();
            $table->date('cheque_date')->nullable();
            $table->string('bank_id', 20)->nullable();
            $table->string('mode_paye', 50)->nullable();
            $table->decimal('mont_recu', 18, 3)->default(0);
            $table->string('status_monaie', 20)->nullable();
            $table->decimal('mont_monaie', 18, 3)->default(0);
            $table->decimal('mobile_amount', 18, 3)->default(0);
            $table->string('operatuer', 50)->nullable();
            $table->string('num_mobile', 20)->nullable();
            $table->bigInteger('paiment_id_numeric')->default(0);

            $table->index('patient_id');
            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_txn_patient_payments');
    }
};
