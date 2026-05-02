<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingSurveillance extends Model
{
    protected $table      = 'nursing_surveillances';
    protected $primaryKey = 'id';

    protected $fillable = [
        'dossier_id',
        'type_surveillance',
        'date_surveillance',
        'data',
        'observations',
        'images',
        'infirmiere_id',
    ];

    protected $casts = [
        'dossier_id'        => 'integer',
        'date_surveillance' => 'date',
        'data'              => 'array',
        'images'            => 'array',
        'infirmiere_id'     => 'integer',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(NursingDossier::class, 'dossier_id', 'id');
    }
}
