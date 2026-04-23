<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Notes de consultation liées à une visite (clinic_txn_adt_notes).
 * Mappé sur Mclinic_txn_adt_notes / objadtnotes.
 */
class AdtNote extends Model
{
    protected $table      = 'clinic_txn_adt_notes';
    protected $primaryKey = 'adt_notes_id';
    public    $timestamps = false;

    protected $fillable = [
        'patient_id',
        'adt_id',
        'adt_notes',
        'created_user_id',
        'created_dttm',
        'hospital_id',
        'adt_note_template_id',
    ];

    protected $casts = [
        'created_dttm'         => 'datetime',
        'adt_note_template_id' => 'integer',
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
