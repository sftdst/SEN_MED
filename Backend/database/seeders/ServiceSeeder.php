<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        Service::create([
            'id_gen_mst_service' => 1,
            'n_ordre' => 1,
            'short_name' => 'Consultation Générale',
            'tri_name' => 'CONSULTATION GENERALE',
            'code_local' => 'CG001',
            'cle_tarif_service' => 'TARIF001',
            'groupe_id' => 1,
            'categorie_id' => 1,
            'type_categorie' => 'Consultation',
            'status' => 1,
            'valeur_cts' => 50000,
            'majoration_ferie' => 0,
            'code_snomed' => 'SN001',
            'code_hl7' => 'HL001',
            'IDgen_mst_Type_Service' => 1,
        ]);

        Service::create([
            'id_gen_mst_service' => 2,
            'n_ordre' => 2,
            'short_name' => 'Radiologie',
            'tri_name' => 'RADIOLOGIE',
            'code_local' => 'RAD001',
            'cle_tarif_service' => 'TARIF002',
            'groupe_id' => 2,
            'categorie_id' => 2,
            'type_categorie' => 'Imagerie',
            'status' => 1,
            'valeur_cts' => 100000,
            'majoration_ferie' => 0,
            'code_snomed' => 'SN002',
            'code_hl7' => 'HL002',
            'IDgen_mst_Type_Service' => 2,
        ]);
    }
}