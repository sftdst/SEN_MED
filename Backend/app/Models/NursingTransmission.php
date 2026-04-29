<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingTransmission extends Model
{
    protected $table      = 'nursing_transmissions';
    protected $primaryKey = 'id';

    protected $fillable = [
        'dossier_id',
        'type_transmission',
        'date_transmission',
        'cible',
        'dar_category',
        'contenu',
        'infirmiere_id',
    ];

    protected $casts = [
        'dossier_id'        => 'integer',
        'date_transmission' => 'date',
        'infirmiere_id'     => 'integer',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(NursingDossier::class, 'dossier_id', 'id');
    }
}
