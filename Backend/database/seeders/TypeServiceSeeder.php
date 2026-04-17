<?php

namespace Database\Seeders;

use App\Models\TypeService;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class TypeServiceSeeder extends Seeder
{
    public function run(): void
    {
        \DB::statement('TRUNCATE TABLE "gen_mst_Type_Service" RESTART IDENTITY CASCADE');

        $types = [
            ['NomType' => 'Consultation', 'description' => 'Services de consultation médicale', 'status' => 1, 'IDgen_mst_Departement' => 1],
            ['NomType' => 'Imagerie', 'description' => 'Services d\'imagerie médicale', 'status' => 1, 'IDgen_mst_Departement' => 12],
            ['NomType' => 'Chirurgie', 'description' => 'Services chirurgicaux', 'status' => 1, 'IDgen_mst_Departement' => 2],
            ['NomType' => 'Laboratoire', 'description' => 'Services de laboratoire et analyses', 'status' => 1, 'IDgen_mst_Departement' => 1],
            ['NomType' => 'Pharmacie', 'description' => 'Services pharmaceutiques', 'status' => 1, 'IDgen_mst_Departement' => 1],
            ['NomType' => 'Hospitalisation', 'description' => 'Services d\'hospitalisation', 'status' => 1, 'IDgen_mst_Departement' => 1],
            ['NomType' => 'Urgence', 'description' => 'Services d\'urgences', 'status' => 1, 'IDgen_mst_Departement' => 1],
            ['NomType' => 'Bloc Opératoire', 'description' => 'Bloc opératoire et salles de soins', 'status' => 1, 'IDgen_mst_Departement' => 2],
        ];

        foreach ($types as $t) {
            TypeService::create($t);
        }
    }
}