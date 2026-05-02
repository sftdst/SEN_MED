<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingTreatment extends Model
{
    protected $table      = 'nursing_treatments';
    protected $primaryKey = 'id';

    protected $fillable = [
        'dossier_id',
        'designation',
        'item_id',
        'item_ref',
        'quantite',
        'prix_unitaire',
        'prix_total',
        'facturation_id',
        'posologie',
        'date_debut',
        'date_fin',
        'arret',
        'matin',
        'midi',
        'soir',
        'nuit',
        'ordre',
    ];

    protected $casts = [
        'dossier_id'    => 'integer',
        'quantite'      => 'integer',
        'prix_unitaire' => 'float',
        'prix_total'    => 'float',
        'facturation_id'=> 'integer',
        'date_debut'    => 'date',
        'date_fin'      => 'date',
        'arret'         => 'boolean',
        'matin'         => 'boolean',
        'midi'          => 'boolean',
        'soir'          => 'boolean',
        'nuit'          => 'boolean',
        'ordre'         => 'integer',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(NursingDossier::class, 'dossier_id', 'id');
    }
}
