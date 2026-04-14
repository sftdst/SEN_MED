<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientPayment extends Model
{
    protected $table      = 'bill_txn_patient_payments';
    protected $primaryKey = 'payment_id';
    public    $timestamps = false;

    protected $fillable = [
        'paid_amount',
        'patient_id',
        'created_dttm',
        'created_user_id',
        'hospital_id',
        'payment_date',
        'total_amount',
        'discount_amount',
        'net_amount',
        'cash_amount',
        'card_amount',
        'cheque_amount',
        'card_no',
        'cheque_no',
        'cheque_date',
        'bank_id',
        'mode_paye',
        'mont_recu',
        'status_monaie',
        'mont_monaie',
        'mobile_amount',
        'operatuer',
        'num_mobile',
        'paiment_id_numeric',
    ];

    protected $casts = [
        'created_dttm'    => 'datetime',
        'payment_date'    => 'date',
        'cheque_date'     => 'date',
        'paid_amount'     => 'decimal:3',
        'total_amount'    => 'decimal:3',
        'discount_amount' => 'decimal:3',
        'net_amount'      => 'decimal:3',
        'cash_amount'     => 'decimal:3',
        'card_amount'     => 'decimal:3',
        'cheque_amount'   => 'decimal:3',
        'mont_recu'       => 'decimal:3',
        'mont_monaie'     => 'decimal:3',
        'mobile_amount'   => 'decimal:3',
    ];
}
