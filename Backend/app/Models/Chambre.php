<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chambre extends Model
{
    protected $table      = 'hosp_chambres';
    protected $primaryKey = 'id_chambre';

    const TYPES = ['Standard', 'VIP', 'Réanimation', 'Maternité', 'Pédiatrie', 'Urgence'];

    const STATUTS = ['Disponible', 'Occupée', 'Maintenance', 'À nettoyer'];

    protected $fillable = [
        'code_chambre', 'nom', 'type', 'prix_journalier',
        'capacite', 'statut', 'description',
    ];

    protected $casts = [
        'prix_journalier' => 'decimal:2',
        'capacite'        => 'integer',
    ];

    public function equipements(): BelongsToMany
    {
        return $this->belongsToMany(
            Equipement::class,
            'hosp_chambre_equipements',
            'id_chambre',
            'id_equipement'
        )->withPivot('quantite', 'etat')->withTimestamps();
    }

    public function hospitalisations(): HasMany
    {
        return $this->hasMany(Hospitalisation::class, 'id_chambre', 'id_chambre');
    }

    public function hospitalisationEnCours(): HasMany
    {
        return $this->hasMany(Hospitalisation::class, 'id_chambre', 'id_chambre')
                    ->where('statut', 'En cours');
    }
}
