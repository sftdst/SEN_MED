<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departement extends Model
{
    protected $table = 'gen_mst_Departement';
    protected $primaryKey = 'IDgen_mst_Departement';

    protected $fillable = [
        'NomDepartement',
        'description',
        'status',
        'Hospital_id',
    ];

    protected $casts = [
        'status'     => 'integer',
        'Hospital_id' => 'integer',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class, 'Hospital_id', 'Hospital_id');
    }

    public function typeServices(): HasMany
    {
        return $this->hasMany(TypeService::class, 'IDgen_mst_Departement', 'IDgen_mst_Departement');
    }
}
