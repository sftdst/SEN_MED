<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingContact extends Model
{
    protected $table      = 'nursing_contacts';
    protected $primaryKey = 'id';

    protected $fillable = [
        'dossier_id',
        'nom',
        'qualite',
        'telephone',
        'ordre',
    ];

    protected $casts = [
        'dossier_id' => 'integer',
        'ordre'      => 'integer',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(NursingDossier::class, 'dossier_id', 'id');
    }
}
