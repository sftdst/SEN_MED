<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactureHospitalisation extends Model
{
    protected $table      = 'hosp_factures';
    protected $primaryKey = 'id_facture';

    const STATUTS_PAIEMENT = ['EN_ATTENTE', 'PARTIEL', 'PAYE'];

    protected $fillable = [
        'id_hospitalisation', 'nb_jours', 'prix_journalier',
        'montant_hebergement', 'montant_soins', 'montant_total',
        'montant_paye', 'montant_restant',
        'statut_paiement', 'date_facture', 'created_user_id',
    ];

    protected $casts = [
        'nb_jours'             => 'integer',
        'prix_journalier'      => 'decimal:2',
        'montant_hebergement'  => 'decimal:2',
        'montant_soins'        => 'decimal:2',
        'montant_total'        => 'decimal:2',
        'montant_paye'         => 'decimal:2',
        'montant_restant'      => 'decimal:2',
        'date_facture'         => 'date',
    ];

    public function hospitalisation(): BelongsTo
    {
        return $this->belongsTo(Hospitalisation::class, 'id_hospitalisation', 'id_hospitalisation');
    }
}
