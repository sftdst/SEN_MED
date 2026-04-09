<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedecinHoraire extends Model
{
    protected $table      = 'medecin_horaire';
    protected $primaryKey = 'IDmedecin_horaire';

    const JOURS = [
        1 => 'Lundi',
        2 => 'Mardi',
        3 => 'Mercredi',
        4 => 'Jeudi',
        5 => 'Vendredi',
        6 => 'Samedi',
        7 => 'Dimanche',
    ];

    protected $fillable = [
        'IDMedecin',
        'JourSemaine',
        'HeureDebut',
        'HeureFin',
        'DureeConsultation',
        'Statut',
    ];

    protected $casts = [
        'IDMedecin'          => 'integer',
        'JourSemaine'        => 'integer',
        'DureeConsultation'  => 'integer',
        'Statut'             => 'integer',
    ];

    protected $appends = ['libelle_jour'];

    public function getLibelleJourAttribute(): string
    {
        return self::JOURS[$this->JourSemaine] ?? 'Inconnu';
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'IDMedecin', 'id');
    }

    /**
     * Calcule le nombre de créneaux disponibles dans la plage.
     */
    public function getNbCreneauxAttribute(): int
    {
        [$hd, $md] = explode(':', substr($this->HeureDebut, 0, 5));
        [$hf, $mf] = explode(':', substr($this->HeureFin,   0, 5));
        $debut = (int)$hd * 60 + (int)$md;
        $fin   = (int)$hf * 60 + (int)$mf;
        $duree = $this->DureeConsultation ?: 20;
        return $duree > 0 ? intdiv($fin - $debut, $duree) : 0;
    }
}
