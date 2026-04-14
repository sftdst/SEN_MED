<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BillHeader extends Model
{
    protected $table      = 'bill_txn_bill_hd';
    protected $primaryKey = 'bill_hd_id';
    public    $timestamps = false;

    protected $fillable = [
        'bill_no',
        'bill_date',
        'patient_id',
        'bill_amount',
        'discount_amount',
        'net_amount',
        'card_no',
        'cheque_no',
        'cheque_date',
        'created_dttm',
        'created_user_id',
        'bill_status_id',
        'cancelled_user_id',
        'cancelled_remarks',
        'paid_amount',
        'pending_amount',
        'card_amount',
        'cash_amount',
        'cheque_amount',
        'bank_id',
        'mode_paye',
        'status_monaie',
        'mont_monaie',
        'mont_recu',
        'bill_id_numeric',
        'adt_id',
        'montant_mobile',
        'telephone',
        'operateur_mobil',
        'mon_remb',
    ];

    protected $casts = [
        'bill_date'        => 'date',
        'cheque_date'      => 'date',
        'created_dttm'     => 'datetime',
        'bill_amount'      => 'decimal:3',
        'discount_amount'  => 'decimal:3',
        'net_amount'       => 'decimal:3',
        'paid_amount'      => 'decimal:3',
        'pending_amount'   => 'decimal:3',
        'card_amount'      => 'decimal:3',
        'cash_amount'      => 'decimal:3',
        'cheque_amount'    => 'decimal:3',
        'mont_monaie'      => 'decimal:3',
        'mont_recu'        => 'decimal:3',
        'montant_mobile'   => 'decimal:3',
        'mon_remb'         => 'decimal:3',
    ];

    public function details(): HasMany
    {
        return $this->hasMany(BillDetail::class, 'bill_hd_id', 'bill_hd_id');
    }
}
