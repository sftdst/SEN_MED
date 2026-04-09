<?php

namespace Database\Seeders;

use App\Models\TypeService;
use Illuminate\Database\Seeder;

class TypeServiceSeeder extends Seeder
{
    public function run(): void
    {
        TypeService::create([
            'NomType' => 'Consultation',
            'description' => 'Services de consultation médicale',
            'status' => 1,
            'IDgen_mst_Departement' => 1,
        ]);

        TypeService::create([
            'NomType' => 'Imagerie',
            'description' => 'Services d\'imagerie médicale',
            'status' => 1,
            'IDgen_mst_Departement' => 2,
        ]);
    }
}