<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NursingDossier extends Model
{
    protected $table      = 'nursing_dossiers';
    protected $primaryKey = 'id';

    protected $fillable = [
        'patient_id',
        'adt_id',
        'hospital_id',
        'date_debut',
        'date_fin',
        'statut',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date_debut'  => 'date',
        'date_fin'    => 'date',
        'hospital_id' => 'integer',
        'adt_id'      => 'integer',
        'created_by'  => 'integer',
    ];

    protected $appends = ['statut_label'];

    // ── Accessor ──────────────────────────────────────────────────────────────

    public function getStatutLabelAttribute(): string
    {
        return match ($this->statut) {
            'termine' => 'Terminé',
            default   => 'En cours',
        };
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function visite(): BelongsTo
    {
        return $this->belongsTo(VisiteAdt::class, 'adt_id', 'adt_id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(NursingContact::class, 'dossier_id', 'id')
                    ->orderBy('ordre');
    }

    public function intervenants(): HasMany
    {
        return $this->hasMany(NursingIntervenant::class, 'dossier_id', 'id');
    }

    public function treatments(): HasMany
    {
        return $this->hasMany(NursingTreatment::class, 'dossier_id', 'id')
                    ->orderBy('ordre');
    }

    public function careRecords(): HasMany
    {
        return $this->hasMany(NursingCareRecord::class, 'dossier_id', 'id')
                    ->orderBy('date_soin');
    }

    public function transmissions(): HasMany
    {
        return $this->hasMany(NursingTransmission::class, 'dossier_id', 'id')
                    ->orderBy('date_transmission', 'desc');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(NursingAssessment::class, 'dossier_id', 'id')
                    ->orderBy('date_evaluation', 'desc');
    }

    public function surveillances(): HasMany
    {
        return $this->hasMany(NursingSurveillance::class, 'dossier_id', 'id')
                    ->orderBy('date_surveillance', 'desc');
    }
}
