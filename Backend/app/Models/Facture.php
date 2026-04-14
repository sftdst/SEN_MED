<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $table      = 'gen_mst_facture';
    protected $primaryKey = 'IDgen_mst_facture';
    public    $timestamps = false;

    protected $fillable = [
        'NomDescription',
        'PrixService',
        'IDService',
        'adt_id',
        'patient_id',
        'MontantPayer',
        'MontantRestant',
        'compagny_id',
        'MontantTotalFacture',
        'StatutPaiement',
        'DateCreation',
        'docteur_id',
        'MontantPartenaire',
        'TypeService',
        'patient_payable',
        'bill_id',
        'ID_Procedure',
        'MontantpayerPartenaire',
    ];

    protected $casts = [
        'DateCreation'           => 'datetime',
        'PrixService'            => 'decimal:3',
        'MontantPayer'           => 'decimal:3',
        'MontantRestant'         => 'decimal:3',
        'MontantTotalFacture'    => 'decimal:3',
        'MontantPartenaire'      => 'decimal:3',
        'patient_payable'        => 'decimal:3',
        'MontantpayerPartenaire' => 'decimal:3',
    ];
}
