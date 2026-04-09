<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeService extends Model
{
    protected $table = 'gen_mst_Type_Service';
    protected $primaryKey = 'IDgen_mst_Type_Service';

    protected $fillable = [
        'NomType',
        'description',
        'status',
        'IDgen_mst_Departement',
    ];

    protected $casts = [
        'status'               => 'integer',
        'IDgen_mst_Departement' => 'integer',
    ];

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class, 'IDgen_mst_Departement', 'IDgen_mst_Departement');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'IDgen_mst_Type_Service', 'IDgen_mst_Type_Service');
    }
}
