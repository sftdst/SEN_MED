<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transfert extends Model
{
    protected $table      = 'hosp_transferts';
    protected $primaryKey = 'id_transfert';

    const TYPES   = ['INTERNE', 'EXTERNE'];
    const STATUTS = ['EN_COURS', 'VALIDE', 'ANNULE'];

    protected $fillable = [
        'patient_id',
        'type_transfert',
        'date_transfert',
        'ancien_medecin_id',
        'nouveau_medecin_id',
        'ancien_service_id',
        'nouveau_service_id',
        'ancienne_chambre_id',
        'nouvelle_chambre_id',
        'structure_destination',
        'medecin_destination',
        'commentaire',
        'motif',
        'statut',
        'created_user_id',
    ];

    protected $casts = [
        'date_transfert' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function ancienMedecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'ancien_medecin_id', 'id');
    }

    public function nouveauMedecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'nouveau_medecin_id', 'id');
    }

    public function ancienService(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'ancien_service_id', 'id_service');
    }

    public function nouveauService(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'nouveau_service_id', 'id_service');
    }

    public function ancienneChambre(): BelongsTo
    {
        return $this->belongsTo(Chambre::class, 'ancienne_chambre_id', 'id_chambre');
    }

    public function nouvelleChambre(): BelongsTo
    {
        return $this->belongsTo(Chambre::class, 'nouvelle_chambre_id', 'id_chambre');
    }
}
