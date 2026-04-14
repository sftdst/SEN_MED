<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        \DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Service::truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $services = [
            ['id_gen_mst_service' => 1, 'n_ordre' => 1, 'short_name' => 'Consultation Générale', 'tri_name' => 'CONSULTATION GENERALE', 'code_local' => 'CG001', 'cle_tarif_service' => 'TARIF001', 'groupe_id' => 1, 'categorie_id' => 1, 'type_categorie' => 'Consultation', 'status' => 1, 'valeur_cts' => 50000, 'majoration_ferie' => 0, 'code_snomed' => 'SN001', 'code_hl7' => 'HL001', 'IDgen_mst_Type_Service' => 1],
            ['id_gen_mst_service' => 2, 'n_ordre' => 2, 'short_name' => 'Radiologie', 'tri_name' => 'RADIOLOGIE', 'code_local' => 'RAD001', 'cle_tarif_service' => 'TARIF002', 'groupe_id' => 2, 'categorie_id' => 2, 'type_categorie' => 'Imagerie', 'status' => 1, 'valeur_cts' => 100000, 'majoration_ferie' => 0, 'code_snomed' => 'SN002', 'code_hl7' => 'HL002', 'IDgen_mst_Type_Service' => 2],
            ['id_gen_mst_service' => 3, 'n_ordre' => 3, 'short_name' => 'Consultation Pédiatrique', 'tri_name' => 'CONSULTATION PEDIATRIQUE', 'code_local' => 'CP001', 'cle_tarif_service' => 'TARIF003', 'groupe_id' => 1, 'categorie_id' => 1, 'type_categorie' => 'Consultation', 'status' => 1, 'valeur_cts' => 45000, 'majoration_ferie' => 0, 'code_snomed' => 'SN003', 'code_hl7' => 'HL003', 'IDgen_mst_Type_Service' => 1],
            ['id_gen_mst_service' => 4, 'n_ordre' => 4, 'short_name' => 'Chirurgie Générale', 'tri_name' => 'CHIRURGIE GENERALE', 'code_local' => 'CH001', 'cle_tarif_service' => 'TARIF004', 'groupe_id' => 3, 'categorie_id' => 3, 'type_categorie' => 'Chirurgie', 'status' => 1, 'valeur_cts' => 250000, 'majoration_ferie' => 50000, 'code_snomed' => 'SN004', 'code_hl7' => 'HL004', 'IDgen_mst_Type_Service' => 3],
            ['id_gen_mst_service' => 5, 'n_ordre' => 5, 'short_name' => 'Analyse de Laboratoire', 'tri_name' => 'ANALYSE LABORATOIRE', 'code_local' => 'LAB001', 'cle_tarif_service' => 'TARIF005', 'groupe_id' => 4, 'categorie_id' => 4, 'type_categorie' => 'Laboratoire', 'status' => 1, 'valeur_cts' => 75000, 'majoration_ferie' => 0, 'code_snomed' => 'SN005', 'code_hl7' => 'HL005', 'IDgen_mst_Type_Service' => 4],
            ['id_gen_mst_service' => 6, 'n_ordre' => 6, 'short_name' => 'Echographie', 'tri_name' => 'ECHOGRAPHIE', 'code_local' => 'ECHO001', 'cle_tarif_service' => 'TARIF006', 'groupe_id' => 2, 'categorie_id' => 2, 'type_categorie' => 'Imagerie', 'status' => 1, 'valeur_cts' => 85000, 'majoration_ferie' => 0, 'code_snomed' => 'SN006', 'code_hl7' => 'HL006', 'IDgen_mst_Type_Service' => 2],
            ['id_gen_mst_service' => 7, 'n_ordre' => 7, 'short_name' => 'Consultation Cardiologique', 'tri_name' => 'CONSULTATION CARDIOLOGIQUE', 'code_local' => 'CC001', 'cle_tarif_service' => 'TARIF007', 'groupe_id' => 1, 'categorie_id' => 1, 'type_categorie' => 'Consultation', 'status' => 1, 'valeur_cts' => 80000, 'majoration_ferie' => 0, 'code_snomed' => 'SN007', 'code_hl7' => 'HL007', 'IDgen_mst_Type_Service' => 1],
            ['id_gen_mst_service' => 8, 'n_ordre' => 8, 'short_name' => 'Urgences', 'tri_name' => 'URGENCES', 'code_local' => 'URG001', 'cle_tarif_service' => 'TARIF008', 'groupe_id' => 5, 'categorie_id' => 5, 'type_categorie' => 'Urgence', 'status' => 1, 'valeur_cts' => 100000, 'majoration_ferie' => 25000, 'code_snomed' => 'SN008', 'code_hl7' => 'HL008', 'IDgen_mst_Type_Service' => 1],
            ['id_gen_mst_service' => 9, 'n_ordre' => 9, 'short_name' => 'Pharmacie', 'tri_name' => 'PHARMACIE', 'code_local' => 'PH001', 'cle_tarif_service' => 'TARIF009', 'groupe_id' => 6, 'categorie_id' => 6, 'type_categorie' => 'Pharmacie', 'status' => 1, 'valeur_cts' => 0, 'majoration_ferie' => 0, 'code_snomed' => 'SN009', 'code_hl7' => 'HL009', 'IDgen_mst_Type_Service' => 5],
            ['id_gen_mst_service' => 10, 'n_ordre' => 10, 'short_name' => 'Consultation Gynécologique', 'tri_name' => 'CONSULTATION GYNECOLOGIQUE', 'code_local' => 'CGY001', 'cle_tarif_service' => 'TARIF010', 'groupe_id' => 1, 'categorie_id' => 1, 'type_categorie' => 'Consultation', 'status' => 1, 'valeur_cts' => 55000, 'majoration_ferie' => 0, 'code_snomed' => 'SN010', 'code_hl7' => 'HL010', 'IDgen_mst_Type_Service' => 1],
            ['id_gen_mst_service' => 11, 'n_ordre' => 11, 'short_name' => 'Scanner', 'tri_name' => 'SCANNER', 'code_local' => 'SCAN001', 'cle_tarif_service' => 'TARIF011', 'groupe_id' => 2, 'categorie_id' => 2, 'type_categorie' => 'Imagerie', 'status' => 1, 'valeur_cts' => 150000, 'majoration_ferie' => 0, 'code_snomed' => 'SN011', 'code_hl7' => 'HL011', 'IDgen_mst_Type_Service' => 2],
            ['id_gen_mst_service' => 12, 'n_ordre' => 12, 'short_name' => 'Hospitalisation', 'tri_name' => 'HOSPITALISATION', 'code_local' => 'HOSP001', 'cle_tarif_service' => 'TARIF012', 'groupe_id' => 7, 'categorie_id' => 7, 'type_categorie' => 'Hospitalisation', 'status' => 1, 'valeur_cts' => 150000, 'majoration_ferie' => 0, 'code_snomed' => 'SN012', 'code_hl7' => 'HL012', 'IDgen_mst_Type_Service' => 6],
        ];

        foreach ($services as $s) {
            Service::updateOrCreate(['id_service' => $s['id_gen_mst_service']], $s);
        }
    }
}