<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class FicheAtt extends Model
{
    protected $table      = 'hosp_fiches_att';
    protected $primaryKey = 'id_fiche';

    const CATEGORIES = ['EXAMEN', 'RADIO', 'SCANNER', 'ECHO', 'ANALYSE', 'ORDONNANCE', 'AUTRE'];

    protected $fillable = [
        'patient_id', 'adt_id', 'nom_fichier', 'chemin',
        'type_mime', 'extension', 'taille', 'categorie',
        'description', 'source', 'created_user_id',
    ];

    protected $casts = [
        'taille' => 'integer',
    ];

    protected $appends = ['url', 'taille_lisible', 'is_image', 'is_pdf'];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function visite(): BelongsTo
    {
        return $this->belongsTo(VisiteAdt::class, 'adt_id', 'adt_id');
    }

    public function getUrlAttribute(): string
    {
        return route('fiches-att.serve', ['fiche' => $this->id_fiche]);
    }

    public function getTailleLisibleAttribute(): string
    {
        $bytes = $this->taille ?? 0;
        if ($bytes < 1024)       return "{$bytes} o";
        if ($bytes < 1048576)    return round($bytes / 1024, 1) . ' Ko';
        return round($bytes / 1048576, 1) . ' Mo';
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->type_mime ?? '', 'image/');
    }

    public function getIsPdfAttribute(): bool
    {
        return ($this->type_mime ?? '') === 'application/pdf';
    }
}
