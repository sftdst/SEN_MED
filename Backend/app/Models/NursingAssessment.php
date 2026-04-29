<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingAssessment extends Model
{
    protected $table      = 'nursing_assessments';
    protected $primaryKey = 'id';

    protected $fillable = [
        'dossier_id',
        'type_echelle',
        'date_evaluation',
        'reponses',
        'score',
        'score_max',
        'interpretation',
        'infirmiere_id',
    ];

    protected $casts = [
        'dossier_id'      => 'integer',
        'date_evaluation' => 'date',
        'reponses'        => 'array',
        'score'           => 'decimal:2',
        'score_max'       => 'decimal:2',
        'infirmiere_id'   => 'integer',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(NursingDossier::class, 'dossier_id', 'id');
    }
}
