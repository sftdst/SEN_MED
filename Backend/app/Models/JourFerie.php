<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JourFerie extends Model
{
    protected $table      = 'jours_feries';
    protected $primaryKey = 'IDjour_ferie';

    protected $fillable = [
        'DateFerie',
        'Libelle',
        'Statut',
    ];

    protected $casts = [
        'DateFerie' => 'date',
        'Statut'    => 'integer',
    ];

    protected $appends = ['libelle_jour'];

    public function getLibelleJourAttribute(): string
    {
        return $this->DateFerie
            ? ucfirst($this->DateFerie->locale('fr')->isoFormat('dddd D MMMM YYYY'))
            : '';
    }

    public function disponibilites(): HasMany
    {
        return $this->hasMany(MedecinFerieDisponibilite::class, 'DateFerie', 'DateFerie');
    }
}
