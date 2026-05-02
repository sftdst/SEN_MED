<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\TypeService;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class AddConsultationsMedicalsServices extends Seeder
{
    public function run(): void
    {
        // Get the Consultation type service ID
        $consultationType = \App\Models\TypeService::where('NomType', 'Consultation')->first();
        
        if (!$consultationType) {
            // If type service doesn't exist, create it first (fallback)
            $consultationType = \App\Models\TypeService::create([
                'NomType' => 'Consultation',
                'description' => 'Services de consultation médicale',
                'status' => 1,
                'IDgen_mst_Departement' => 1, // Médecine Interne
            ]);
        }

        $services = [
            // Consultations Générales
            [
                'id_gen_mst_service' => 'CM001',
                'n_ordre' => 1,
                'short_name' => 'Consultation au centre',
                'tri_name' => 'CONSULTATION CENTRE',
                'code_local' => 'C8',
                'cle_tarif_service' => 'TARIF_CM001',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 8000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM001',
                'code_hl7' => 'CM001',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            [
                'id_gen_mst_service' => 'CM002',
                'n_ordre' => 2,
                'short_name' => 'Consultation à domicile',
                'tri_name' => 'CONSULTATION DOMICILE',
                'code_local' => 'V15',
                'cle_tarif_service' => 'TARIF_CM002',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 15000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM002',
                'code_hl7' => 'CM002',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            [
                'id_gen_mst_service' => 'CM003',
                'n_ordre' => 3,
                'short_name' => 'Consultation conventionnée',
                'tri_name' => 'CONSULTATION CONVENTIONNEE',
                'code_local' => 'C7',
                'cle_tarif_service' => 'TARIF_CM003',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 7500,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM003',
                'code_hl7' => 'CM003',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            
            // Urgences et Majorations
            [
                'id_gen_mst_service' => 'CM004',
                'n_ordre' => 4,
                'short_name' => 'Consultation d\'urgence vitale',
                'tri_name' => 'CONSULTATION URGENCE VITALE',
                'code_local' => 'URGV',
                'cle_tarif_service' => 'TARIF_CM004',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 200000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM004',
                'code_hl7' => 'CM004',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            [
                'id_gen_mst_service' => 'CM005',
                'n_ordre' => 5,
                'short_name' => 'Majoration de nuit',
                'tri_name' => 'MAJORATION NUIT',
                'code_local' => 'MN',
                'cle_tarif_service' => 'TARIF_CM005',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 12000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM005',
                'code_hl7' => 'CM005',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            [
                'id_gen_mst_service' => 'CM006',
                'n_ordre' => 6,
                'short_name' => 'Majoration dimanche et jours fériés',
                'tri_name' => 'MAJORATION DIMANCHE FERIES',
                'code_local' => 'MF',
                'cle_tarif_service' => 'TARIF_CM006',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 0, // À définir selon la note
                'majoration_ferie' => 0,
                'code_snomed' => 'CM006',
                'code_hl7' => 'CM006',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            
            // Suivis et Frais Administratifs
            [
                'id_gen_mst_service' => 'CM007',
                'n_ordre' => 7,
                'short_name' => 'Consultation de suivi',
                'tri_name' => 'CONSULTATION SUIVI',
                'code_local' => 'SUIVI',
                'cle_tarif_service' => 'TARIF_CM007',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 80000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM007',
                'code_hl7' => 'CM007',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            [
                'id_gen_mst_service' => 'CM008',
                'n_ordre' => 8,
                'short_name' => 'Frais d\'ouverture de dossier et carnet de santé',
                'tri_name' => 'FRAIS OUVERTURE DOSSIER',
                'code_local' => 'FOD',
                'cle_tarif_service' => 'TARIF_CM008',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 2000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM008',
                'code_hl7' => 'CM008',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            
            // Consultations Spécialisées
            [
                'id_gen_mst_service' => 'CM009',
                'n_ordre' => 9,
                'short_name' => 'Première consultation spécialisée',
                'tri_name' => 'PREMIERE CONSULTATION SPE',
                'code_local' => 'CS15',
                'cle_tarif_service' => 'TARIF_CM009',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 15000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM009',
                'code_hl7' => 'CM009',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            [
                'id_gen_mst_service' => 'CM010',
                'n_ordre' => 10,
                'short_name' => 'Consultation de suivi spécialisée (15 jours)',
                'tri_name' => 'CONSULTATION SUIVI SPE 15J',
                'code_local' => 'CS10',
                'cle_tarif_service' => 'TARIF_CM010',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 10000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM010',
                'code_hl7' => 'CM010',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
            [
                'id_gen_mst_service' => 'CM011',
                'n_ordre' => 11,
                'short_name' => 'Consultation sous IPM',
                'tri_name' => 'CONSULTATION SOUS IPM',
                'code_local' => 'CS10IPM',
                'cle_tarif_service' => 'TARIF_CM011',
                'groupe_id' => 1,
                'categorie_id' => 1,
                'type_categorie' => 'Consultation',
                'status' => 1,
                'valeur_cts' => 10000,
                'majoration_ferie' => 0,
                'code_snomed' => 'CM011',
                'code_hl7' => 'CM011',
                'IDgen_mst_Type_Service' => $consultationType->IDgen_mst_Type_Service,
            ],
        ];

        foreach ($services as $serviceData) {
            Service::updateOrCreate(
                ['id_gen_mst_service' => $serviceData['id_gen_mst_service']],
                $serviceData
            );
        }
    }
}