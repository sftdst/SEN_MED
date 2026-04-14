<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillDetail extends Model
{
    protected $table      = 'bill_txn_bill_details';
    protected $primaryKey = 'bill_txn_id';
    public    $timestamps = false;

    protected $fillable = [
        'bill_hd_id',
        'service_id',
        'service_price',
        'service_qty',
        'total_price',
        'net_amount',
        'discount_amount',
        'service_type_id',
        'created_dttm',
        'created_user_id',
        'sr_no',
    ];

    protected $casts = [
        'created_dttm'    => 'datetime',
        'service_price'   => 'decimal:3',
        'total_price'     => 'decimal:3',
        'net_amount'      => 'decimal:3',
        'discount_amount' => 'decimal:3',
        'service_qty'     => 'integer',
        'sr_no'           => 'integer',
    ];

    public function billHeader(): BelongsTo
    {
        return $this->belongsTo(BillHeader::class, 'bill_hd_id', 'bill_hd_id');
    }
}
