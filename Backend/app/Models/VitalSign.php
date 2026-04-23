<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Signes vitaux d'une consultation (clinic_txn_vital_sign).
 * Mappé sur Mclinic_txn_vital_sign / objvitalsigns.
 */
class VitalSign extends Model
{
    protected $table      = 'clinic_txn_vital_sign';
    protected $primaryKey = 'vital_sign_id';
    public    $timestamps = false;

    protected $fillable = [
        'patient_id',
        'hospital_id',
        'adt_id',
        'temperature_f',
        'temperature_c',
        'pulse',
        'respiration',
        'bp_systolic_r',
        'bp_diastolic_r',
        'bp_systolic_l',
        'bp_diastolic_l',
        'weights',
        'height',
        'bmi',
        'spo_2',
        'created_user_id',
        'created_dttm',
    ];

    protected $casts = [
        'temperature_f'  => 'decimal:2',
        'temperature_c'  => 'decimal:2',
        'pulse'          => 'decimal:2',
        'respiration'    => 'decimal:2',
        'bp_systolic_r'  => 'decimal:2',
        'bp_diastolic_r' => 'decimal:2',
        'bp_systolic_l'  => 'decimal:2',
        'bp_diastolic_l' => 'decimal:2',
        'weights'        => 'decimal:2',
        'height'         => 'decimal:2',
        'bmi'            => 'decimal:2',
        'spo_2'          => 'decimal:2',
        'created_dttm'   => 'datetime',
    ];

    // ── Accesseur : calcul automatique de l'IMC si poids+taille fournis ─────
    public function calculerBmi(): ?float
    {
        if ($this->weights > 0 && $this->height > 0) {
            $heightM = $this->height / 100;
            return round($this->weights / ($heightM * $heightM), 2);
        }
        return null;
    }

    public function visite(): BelongsTo
    {
        return $this->belongsTo(VisiteAdt::class, 'adt_id', 'adt_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }
}
