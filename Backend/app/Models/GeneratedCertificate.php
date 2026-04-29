<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedCertificate extends Model
{
    protected $table    = 'generated_certificates';
    protected $fillable = ['adt_id', 'template_id', 'template_name', 'generated_by'];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(DocTemplate::class, 'template_id');
    }

    public function visite(): BelongsTo
    {
        return $this->belongsTo(VisiteAdt::class, 'adt_id', 'adt_id');
    }
}
