<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Patient extends Model
{
    protected $table = 'gen_mst_patient';
    protected $primaryKey = 'id_Rep';
    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'patient_code',
        'patient_id_numeric',
        'title_id',
        'first_name',
        'second_name',
        'last_name',
        'patient_name',
        'gender_id',
        'dob',
        'lieu_naissance',
        'age_patient',
        'type_age',
        'marital_status_id',
        'marital_name',
        'civiity_id',
        'nationality_id',
        'country',
        'city',
        'address',
        'address2',
        'postal_code',
        'residence',
        'contact_number',
        'mobile_number',
        'email_adress',
        'emergency_contact_name',
        'emergency_contact_number',
        'pere_name',
        'mere_name',
        'mere_last_name',
        'father_adop',
        'mother_adop',
        'family_id',
        'compte_famille',
        'codefamilla',
        'relation_type_id',
        'responsable',
        'profession',
        'fonctions',
        'emplos',
        'socite',
        'lieu_travail',
        'contrat_type',
        'staff_no',
        'company_id',
        'type_couverture',
        'num_police',
        'validate',
        'family_doctor',
        'telmedcin',
        'email_medcin',
        'ssn_no',
        'pending_amount',
        'status_id',
        'habitual_ide',
        'sama_numero',
        'created_user_id',
        'created_dttm',
        'modified_dttm',
        'phone_adop',
    ];

    protected $casts = [
        'dob'           => 'datetime',
        'created_dttm'  => 'datetime',
        'modified_dttm' => 'datetime',
        'validate'      => 'date',
        'pending_amount' => 'decimal:3',
        'age_patient'   => 'integer',
        'status_id'     => 'integer',
    ];

    protected $appends = ['age'];

    /**
     * Relation avec le partenaire (compagnie d'assurance)
     */
    public function partenaire(): BelongsTo
    {
        return $this->belongsTo(PartenaireHeader::class, 'company_id', 'id_Rep');
    }

    /**
     * Calcul automatique de l'âge à partir de la date de naissance
     */
    public function getAgeAttribute(): ?int
    {
        if (!$this->dob) return null;
        return \Carbon\Carbon::parse($this->dob)->age;
    }

    /**
     * Synchroniser l'age_patient avec le calcul automatique
     */
    public function setDobAttribute($value): void
    {
        $this->attributes['dob'] = $value;
        if ($value) {
            $this->attributes['age_patient'] = \Carbon\Carbon::parse($value)->age;
        }
    }

    /**
     * Scopes pour recherche
     */
    public function scopeActifs($query)
    {
        return $query->where('status_id', 1);
    }

    public function scopeRecherche($query, $search)
    {
        if (!$search) return $query;
        
        return $query->where(function ($q) use ($search) {
            $q->where('patient_name', 'ilike', "%{$search}%")
              ->orWhere('patient_id', 'ilike', "%{$search}%")
              ->orWhere('patient_code', 'ilike', "%{$search}%")
              ->orWhere('mobile_number', 'ilike', "%{$search}%")
              ->orWhere('contact_number', 'ilike', "%{$search}%")
              ->orWhere('ssn_no', 'ilike', "%{$search}%");
        });
    }
}
