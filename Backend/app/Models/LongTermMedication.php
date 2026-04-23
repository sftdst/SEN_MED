<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Traitements chroniques du patient (clinic_txn_long_term_medication).
 * Mappé sur Mclinic_txn_long_term_medication / objlongtermmedication.
 */
class LongTermMedication extends Model
{
    protected $table      = 'clinic_txn_long_term_medication';
    protected $primaryKey = 'medication_id';
    public    $timestamps = false;

    protected $fillable = [
        'patient_id',
        'item_id',
        'item_name',
        'med_start_date',
        'med_end_date',
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
        'med_start_date' => 'date',
        'med_end_date'   => 'date',
        'duration'       => 'integer',
        'status_id'      => 'integer',
        'created_dttm'   => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }
}
