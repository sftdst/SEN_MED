<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Notes générales sur le patient (clinic_txn_patient_notes).
 * Mappé sur Mclinic_txn_patient_notes / objpatientnotes.
 */
class PatientNote extends Model
{
    protected $table      = 'clinic_txn_patient_notes';
    protected $primaryKey = 'patient_notes_id';
    public    $timestamps = false;

    protected $fillable = [
        'patient_id',
        'adt_id',
        'patient_notes',
        'created_user_id',
        'created_dttm',
        'hospital_id',
        'adt_note_template_id',
    ];

    protected $casts = [
        'created_dttm'         => 'datetime',
        'adt_note_template_id' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function visite(): BelongsTo
    {
        return $this->belongsTo(VisiteAdt::class, 'adt_id', 'adt_id');
    }
}
