<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VisiteAdt extends Model
{
    protected $table      = 'clinic_txn_adt';
    protected $primaryKey = 'adt_id';
    public    $timestamps = false;

    protected $fillable = [
        'patient_pin',
        'visit_datetime',
        'consulting_doctor_id',
        'visit_type',
        'hospital_id',
        'created_user_id',
        'created_dttm',
        'doctor_seen',
        'bill_amount',
        'refered_doctor',
        'refered_hospital',
        'numero_medcin',
        'visit_place',
        'ID_Compagny',
        'ID_TypeCouverture',
        'prise_en_charge',
        'contrat_pol',
        'attestation',
        'societe',
        'ref_pc',
        'date',
        'Lien_Parente',
        'urgence',
        'Hospitaliser',
        'IDgen_mst_Departement',
        'Total_a_payer',
        'montant_patient',
        'montant_compagny',
    ];

    protected $casts = [
        'visit_datetime'   => 'datetime',
        'created_dttm'     => 'datetime',
        'date'             => 'date',
        'prise_en_charge'  => 'boolean',
        'contrat_pol'      => 'boolean',
        'attestation'      => 'boolean',
        'urgence'          => 'boolean',
        'Hospitaliser'     => 'boolean',
        'doctor_seen'      => 'integer',
        'bill_amount'      => 'decimal:3',
        'Total_a_payer'    => 'decimal:3',
        'montant_patient'  => 'decimal:3',
        'montant_compagny' => 'decimal:3',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_pin', 'patient_id');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'consulting_doctor_id', 'user_id');
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class, 'adt_id', 'adt_id');
    }

    public function billHeader(): HasMany
    {
        return $this->hasMany(BillHeader::class, 'adt_id', 'adt_id');
    }
}
