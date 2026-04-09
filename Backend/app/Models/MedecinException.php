<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedecinException extends Model
{
    protected $table      = 'medecin_exception';
    protected $primaryKey = 'IDmedecin_exception';

    const TYPES = [
        'conge'     => 'Congé',
        'maladie'   => 'Maladie',
        'mission'   => 'Mission',
        'formation' => 'Formation',
        'autre'     => 'Autre',
    ];

    protected $fillable = [
        'IDMedecin',
        'DateDebut',
        'DateFin',
        'Type',
        'Description',
    ];

    protected $casts = [
        'IDMedecin' => 'integer',
        'DateDebut' => 'datetime',
        'DateFin'   => 'datetime',
    ];

    protected $appends = ['libelle_type', 'nb_jours'];

    public function getLibelleTypeAttribute(): string
    {
        return self::TYPES[$this->Type] ?? ($this->Type ?? 'Absence');
    }

    public function getNbJoursAttribute(): int
    {
        return (int) $this->DateDebut->diffInDays($this->DateFin) + 1;
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'IDMedecin', 'id');
    }
}
