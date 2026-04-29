<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingCareRecord extends Model
{
    protected $table      = 'nursing_care_records';
    protected $primaryKey = 'id';

    protected $fillable = [
        'dossier_id',
        'date_soin',
        'soin_category',
        'soin_label',
        'periode',
        'realise',
        'note',
        'infirmiere_id',
    ];

    protected $casts = [
        'dossier_id'    => 'integer',
        'date_soin'     => 'date',
        'realise'       => 'boolean',
        'infirmiere_id' => 'integer',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(NursingDossier::class, 'dossier_id', 'id');
    }
}
