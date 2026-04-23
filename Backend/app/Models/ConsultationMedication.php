<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Prescriptions d'une consultation (clinic_txn_medication).
 * Mappé sur Cls_Clinic_Txn_Medication / objmedication_v.
 */
class ConsultationMedication extends Model
{
    protected $table      = 'clinic_txn_medication';
    protected $primaryKey = 'medication_id';
    public    $timestamps = false;

    protected $fillable = [
        'patient_id',
        'adt_id',
        'hospital_id',
        'item_id',
        'item_name',
        'dosage',
        'frequency',
        'duration',
        'duration_type',
        'usage',
        'food_type',
        'doctor_notes',
        'status_id',
        'created_user_id',
        'created_dttm',
    ];

    protected $casts = [
        'duration'     => 'integer',
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
