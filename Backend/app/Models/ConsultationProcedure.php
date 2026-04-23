<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Actes / procédures cliniques d'une consultation (clinic_txn_procedures).
 * Mappé sur Cls_clinic_txn_procedures / objprocedures_v.
 */
class ConsultationProcedure extends Model
{
    protected $table      = 'clinic_txn_procedures';
    protected $primaryKey = 'procedure_id';
    public    $timestamps = false;

    protected $fillable = [
        'patient_id',
        'adt_id',
        'hospital_id',
        'procedure_code',
        'procedure_name',
        'procedure_type',
        'description',
        'doctor_notes',
        'cost',
        'result',
        'status_id',
        'created_user_id',
        'created_dttm',
    ];

    protected $casts = [
        'cost'         => 'decimal:2',
        'status_id'    => 'integer',
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
