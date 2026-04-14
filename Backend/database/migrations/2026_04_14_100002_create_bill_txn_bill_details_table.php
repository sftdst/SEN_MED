<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_txn_bill_details', function (Blueprint $table) {
            $table->id('bill_txn_id');
            $table->unsignedBigInteger('bill_hd_id')->nullable();
            $table->string('service_id', 20)->nullable();
            $table->decimal('service_price', 18, 3)->default(0);
            $table->integer('service_qty')->default(1);
            $table->decimal('total_price', 18, 3)->default(0);
            $table->decimal('net_amount', 18, 3)->default(0);
            $table->decimal('discount_amount', 18, 3)->default(0);
            $table->string('service_type_id', 20)->nullable();
            $table->timestamp('created_dttm')->useCurrent();
            $table->string('created_user_id', 20)->nullable();
            $table->integer('sr_no')->default(0);

            $table->index('bill_hd_id');
            $table->index('service_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_txn_bill_details');
    }
};
