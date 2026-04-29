<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingIntervenant extends Model
{
    protected $table      = 'nursing_intervenants';
    protected $primaryKey = 'id';

    protected $fillable = [
        'dossier_id',
        'type_intervenant',
        'nom',
        'telephone',
        'cabinet',
    ];

    protected $casts = [
        'dossier_id' => 'integer',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(NursingDossier::class, 'dossier_id', 'id');
    }
}
