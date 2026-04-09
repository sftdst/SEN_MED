<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Personnel extends Model
{
    protected $table = 'hr_mst_user';
    protected $primaryKey = 'id';

    // Genres disponibles
    const GENRES = [
        'masculin' => 'Masculin',
        'feminin'  => 'Féminin',
    ];

    // Types de personnel
    const TYPES_PERSONNEL = [
        'medecin'          => 'Médecin',
        'infirmier'        => 'Infirmier(e)',
        'technicien'       => 'Technicien(ne)',
        'administratif'    => 'Administratif',
        'sage_femme'       => 'Sage-femme',
        'kinesitherapeute' => 'Kinésithérapeute',
        'pharmacien'       => 'Pharmacien(ne)',
        'autre'            => 'Autre',
    ];

    // Groupes sanguins
    const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    protected $fillable = [
        'user_id',
        'staff_name',
        'status_id',
        'gender_id',
        'created_user_id',
        'created_dttm',
        'user_name',
        'modified_dttm',
        'email_adress',
        'date_of_birth',
        'staff_type',
        'contact_number',
        'specialization',
        'first_name',
        'last_name',
        'nationality_id',
        'address',
        'phone_number',
        'autre_adress',
        'email_pro',
        'Joining_date',
        'End_of_service_date',
        'city',
        'type_adresse',
        'code_postal',
        'ville_principal',
        'ville_secondaire',
        'ID_pro',
        'type_exercie',
        'secteur',
        'lieu_exercice',
        'country_id',
        'second_name',
        'groupe_sanguin',
        'personnel',
        'consult',
        'titre_id',
        'IDgen_mst_Departement',
    ];

    protected $casts = [
        'status_id'           => 'integer',
        'nationality_id'      => 'integer',
        'personnel'           => 'integer',
        'consult'             => 'integer',
        'IDgen_mst_Departement' => 'integer',
        'date_of_birth'       => 'date',
        'Joining_date'        => 'date',
        'End_of_service_date' => 'date',
        'created_dttm'        => 'datetime',
        'modified_dttm'       => 'datetime',
    ];

    // Libellés français de tous les champs (utilisés côté frontend/API)
    public static function labels(): array
    {
        return [
            'user_id'               => 'Identifiant personnel',
            'staff_name'            => 'Nom complet',
            'status_id'             => 'Statut',
            'gender_id'             => 'Genre',
            'user_name'             => 'Nom d\'utilisateur',
            'email_adress'          => 'Email personnel',
            'date_of_birth'         => 'Date de naissance',
            'staff_type'            => 'Type de personnel',
            'contact_number'        => 'Numéro de contact',
            'specialization'        => 'Spécialisation',
            'first_name'            => 'Prénom',
            'last_name'             => 'Nom de famille',
            'second_name'           => 'Deuxième prénom',
            'nationality_id'        => 'Nationalité',
            'address'               => 'Adresse principale',
            'phone_number'          => 'Téléphone',
            'autre_adress'          => 'Autre adresse',
            'email_pro'             => 'Email professionnel',
            'Joining_date'          => 'Date d\'entrée en service',
            'End_of_service_date'   => 'Date de fin de service',
            'city'                  => 'Ville',
            'type_adresse'          => 'Type d\'adresse',
            'code_postal'           => 'Code postal',
            'ville_principal'       => 'Ville principale',
            'ville_secondaire'      => 'Ville secondaire',
            'ID_pro'                => 'Identifiant professionnel',
            'type_exercie'          => 'Type d\'exercice',
            'secteur'               => 'Secteur d\'activité',
            'lieu_exercice'         => 'Lieu d\'exercice',
            'country_id'            => 'Pays',
            'groupe_sanguin'        => 'Groupe sanguin',
            'personnel'             => 'Est personnel',
            'consult'               => 'Est consultant',
            'titre_id'              => 'Titre',
            'IDgen_mst_Departement' => 'Département',
        ];
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class, 'IDgen_mst_Departement', 'IDgen_mst_Departement');
    }
}
