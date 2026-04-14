<?php

namespace Database\Seeders;

use App\Models\Departement;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class DepartementSeeder extends Seeder
{
    public function run(): void
    {
        \DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Departement::truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $departements = [
            ['IDgen_mst_Departement' => 1,  'NomDepartement' => 'Médecine Interne',    'description' => 'Département de médecine interne',                        'status' => 1, 'Hospital_id' => 1],
            ['IDgen_mst_Departement' => 2,  'NomDepartement' => 'Chirurgie',           'description' => 'Département de chirurgie générale et spécialisée',        'status' => 1, 'Hospital_id' => 1],
            ['IDgen_mst_Departement' => 3,  'NomDepartement' => 'Pédiatrie',           'description' => 'Département de pédiatrie et soins aux enfants',           'status' => 1, 'Hospital_id' => 2],
            ['IDgen_mst_Departement' => 4,  'NomDepartement' => 'Gynécologie',         'description' => 'Département de gynécologie et obstétrique',               'status' => 1, 'Hospital_id' => 1],
            ['IDgen_mst_Departement' => 5,  'NomDepartement' => 'Cardiologie',         'description' => 'Département de cardiologie et maladies cardiovasculaires', 'status' => 1, 'Hospital_id' => 1],
            ['IDgen_mst_Departement' => 6,  'NomDepartement' => 'Neurologie',          'description' => 'Département de neurologie',                               'status' => 1, 'Hospital_id' => 2],
            ['IDgen_mst_Departement' => 7,  'NomDepartement' => 'Ophtalmologie',       'description' => 'Département d\'ophtalmologie et soins visuels',           'status' => 1, 'Hospital_id' => 1],
            ['IDgen_mst_Departement' => 8,  'NomDepartement' => 'Orthopédie',          'description' => 'Département d\'orthopédie et traumatologie',              'status' => 1, 'Hospital_id' => 2],
            ['IDgen_mst_Departement' => 9,  'NomDepartement' => 'Dermatologie',        'description' => 'Département de dermatologie',                             'status' => 1, 'Hospital_id' => 1],
            ['IDgen_mst_Departement' => 10, 'NomDepartement' => 'Urologie',            'description' => 'Département d\'urologie',                                 'status' => 1, 'Hospital_id' => 2],
            ['IDgen_mst_Departement' => 11, 'NomDepartement' => 'Gastro-entérologie',  'description' => 'Département de gastro-entérologie',                       'status' => 1, 'Hospital_id' => 1],
            ['IDgen_mst_Departement' => 12, 'NomDepartement' => 'Radiologie',          'description' => 'Département d\'imagerie médicale et radiologie',          'status' => 1, 'Hospital_id' => 1],
        ];

        foreach ($departements as $dept) {
            Departement::create($dept);
        }
    }
}