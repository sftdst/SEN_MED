<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Equipement extends Model
{
    protected $table      = 'hosp_equipements';
    protected $primaryKey = 'id_equipement';

    protected $fillable = ['nom', 'description'];

    public function chambres(): BelongsToMany
    {
        return $this->belongsToMany(
            Chambre::class,
            'hosp_chambre_equipements',
            'id_equipement',
            'id_chambre'
        )->withPivot('quantite', 'etat')->withTimestamps();
    }
}
