<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Examens de laboratoire (lab_txn_procedures).
 * Mappé sur Cls_Lab_Txn_Procedures / objlabprocedures_v.
 */
class LabProcedure extends Model
{
    protected $table      = 'lab_txn_procedures';
    protected $primaryKey = 'lab_procedure_id';
    public    $timestamps = false;

    protected $fillable = [
        'patient_id',
        'adt_id',
        'hospital_id',
        'lab_test_code',
        'lab_test_name',
        'lab_category',
        'result',
        'unit',
        'normal_range',
        'result_status',
        'doctor_notes',
        'cost',
        'status_id',
        'result_date',
        'created_user_id',
        'created_dttm',
    ];

    protected $casts = [
        'cost'         => 'decimal:2',
        'status_id'    => 'integer',
        'result_date'  => 'date',
        'created_dttm' => 'datetime',
    ];

    public function visite(): BelongsTo
    {
        return $this->belongsTo(VisiteAdt::class, 'adt_id', 'adt_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }
}
