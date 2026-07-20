<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

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

    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo) return null;
        if (str_starts_with($this->logo, 'http')) return $this->logo;
        return Storage::disk('public')->url($this->logo);
    }

    public function departements(): HasMany
    {
        return $this->hasMany(Departement::class, 'Hospital_id', 'Hospital_id');
    }
}
