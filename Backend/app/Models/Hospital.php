<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hospital extends Model
{
    protected $table = 'gen_mst_hospital';
    protected $primaryKey = 'id_Rep';

    protected $fillable = [
        'Hospital_id',
        'hospital_name',
        'short_name',
        'adress',
        'postal_code',
        'zip_code',
        'fax',
        'mobile_number',
        'contact_number',
        'email_address',
        'website',
        'status_id',
        'logo',
        'type_cabinet',
    ];

    protected $casts = [
        'Hospital_id' => 'integer',
        'status_id'   => 'integer',
    ];

    // logo est un bytea PostgreSQL — le convertir en base64 pour l'API
    public function getLogoAttribute($value): ?string
    {
        if ($value === null) return null;
        if (is_resource($value)) return base64_encode(stream_get_contents($value));
        return base64_encode($value);
    }

    public function departements(): HasMany
    {
        return $this->hasMany(Departement::class, 'Hospital_id', 'Hospital_id');
    }
}
