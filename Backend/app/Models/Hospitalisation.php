<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;

class Hospitalisation extends Model
{
    protected $table      = 'hosp_hospitalisations';
    protected $primaryKey = 'id_hospitalisation';

    const STATUTS = ['En cours', 'Terminée', 'Annulée'];

    protected $fillable = [
        'patient_id', 'id_chambre', 'medecin_id',
        'date_entree', 'date_sortie_prevue', 'date_sortie_reelle',
        'motif', 'statut', 'created_user_id',
    ];

    protected $casts = [
        'date_entree'         => 'date',
        'date_sortie_prevue'  => 'date',
        'date_sortie_reelle'  => 'date',
    ];

    public function chambre(): BelongsTo
    {
        return $this->belongsTo(Chambre::class, 'id_chambre', 'id_chambre');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'medecin_id', 'id');
    }

    public function facture(): HasOne
    {
        return $this->hasOne(FactureHospitalisation::class, 'id_hospitalisation', 'id_hospitalisation');
    }

    /** Nombre de jours réels ou prévisionnels */
    public function getNbJoursAttribute(): int
    {
        $entree = $this->date_entree;
        $sortie = $this->date_sortie_reelle ?? $this->date_sortie_prevue ?? Carbon::today();
        return max(1, $entree->diffInDays($sortie));
    }

    /** Montant total calculé */
    public function getMontantTotalAttribute(): float
    {
        return $this->nb_jours * (float) ($this->chambre?->prix_journalier ?? 0);
    }
}
