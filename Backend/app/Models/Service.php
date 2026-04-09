<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Service extends Model
{
    protected $table = 'gen_mst_service';
    protected $primaryKey = 'id_service';

    protected $fillable = [
        'id_gen_mst_service',
        'n_ordre',
        'short_name',
        'tri_name',
        'code_local',
        'cle_tarif_service',
        'groupe_id',
        'categorie_id',
        'type_categorie',
        'status',
        'valeur_cts',
        'majoration_ferie',
        'code_snomed',
        'code_hl7',
        'IDgen_mst_Type_Service',
    ];

    protected $casts = [
        'status'                 => 'integer',
        'IDgen_mst_Type_Service' => 'integer',
    ];

    public function typeService(): BelongsTo
    {
        return $this->belongsTo(TypeService::class, 'IDgen_mst_Type_Service', 'IDgen_mst_Type_Service');
    }
}
