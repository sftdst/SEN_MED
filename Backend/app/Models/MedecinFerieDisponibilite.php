<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedecinFerieDisponibilite extends Model
{
    protected $table      = 'medecin_ferie_disponibilite';
    protected $primaryKey = 'IDmedecin_ferie';

    protected $fillable = [
        'IDMedecin',
        'DateFerie',
        'HeureDebut',
        'HeureFin',
        'DureeConsultation',
        'Statut',
    ];

    protected $casts = [
        'IDMedecin'         => 'integer',
        'DateFerie'         => 'date',
        'DureeConsultation' => 'integer',
        'Statut'            => 'integer',
    ];

    protected $appends = ['nb_creneaux'];

    public function getNbCreneauxAttribute(): int
    {
        if (!$this->HeureDebut || !$this->HeureFin) return 0;
        [$hd, $md] = explode(':', substr($this->HeureDebut, 0, 5));
        [$hf, $mf] = explode(':', substr($this->HeureFin,   0, 5));
        $debut = (int)$hd * 60 + (int)$md;
        $fin   = (int)$hf * 60 + (int)$mf;
        $duree = $this->DureeConsultation ?: 20;
        return $duree > 0 ? intdiv($fin - $debut, $duree) : 0;
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'IDMedecin', 'id');
    }

    public function jourFerie(): BelongsTo
    {
        return $this->belongsTo(JourFerie::class, 'DateFerie', 'DateFerie');
    }
}
