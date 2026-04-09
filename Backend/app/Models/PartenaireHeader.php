<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartenaireHeader extends Model
{
    use HasFactory;
    protected $table      = 'gen_mst_partenaire_header';
    protected $primaryKey = 'id_Rep';

    const TYPES_PARTENAIRE = [
        0 => 'Assurance',
        1 => 'Mutuelle',
        2 => 'Entreprise',
        3 => 'Organisation',
        4 => 'Autre',
    ];

    const TYPES_SOCIETE = [
        'SA'    => 'Société Anonyme (SA)',
        'SARL'  => 'SARL',
        'SNC'   => 'Société en Nom Collectif',
        'GIE'   => 'Groupement d\'Intérêt Économique',
        'autre' => 'Autre',
    ];

    protected $fillable = [
        'id_gen_partenaire',
        'Nom',
        'pays',
        'ville',
        'adress',
        'contact',
        'mobile',
        'bank',
        'email',
        'type_societe',
        'numero_compte',
        'maximum_credit',
        'pending_amount',
        'paid_amount',
        'date_created',
        'code_societe',
        'status',
        'TypePart',
    ];

    protected $casts = [
        'maximum_credit' => 'integer',
        'pending_amount' => 'integer',
        'paid_amount'    => 'integer',
        'status'         => 'boolean',
        'TypePart'       => 'integer',
        'date_created'   => 'date',
    ];

    protected $appends = ['libelle_type'];

    public function getLibelleTypeAttribute(): string
    {
        return self::TYPES_PARTENAIRE[$this->TypePart] ?? 'Inconnu';
    }

    public function typesCouverture(): HasMany
    {
        return $this->hasMany(PartenaireDtl::class, 'Id_gen_partenaire', 'id_gen_partenaire');
    }
}
