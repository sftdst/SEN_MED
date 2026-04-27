<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ordonnance extends Model
{
    protected $table      = 'clinic_txn_ordonnances';
    protected $primaryKey = 'ordonnance_id';

    protected $fillable = [
        'adt_id',
        'patient_id',
        'medecin_id',
        'contenu_html',
        'contenu_texte',
        'statut',
        'date_prescription',
        'created_user_id',
        'hospital_id',
    ];

    protected $casts = [
        'date_prescription' => 'datetime',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function visite(): BelongsTo
    {
        return $this->belongsTo(VisiteAdt::class, 'adt_id', 'adt_id');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'medecin_id', 'user_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }
}
