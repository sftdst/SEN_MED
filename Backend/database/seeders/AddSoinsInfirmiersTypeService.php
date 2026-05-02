<?php

namespace Database\Seeders;

use App\Models\TypeService;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class AddSoinsInfirmiersTypeService extends Seeder
{
    public function run(): void
    {
        // Check if Soins Infirmiers type service already exists
        if (!TypeService::where('NomType', 'Soins Infirmiers')->exists()) {
            TypeService::create([
                'NomType' => 'Soins Infirmiers',
                'description' => 'Services de soins infirmiers généraux et spécialisés',
                'status' => 1,
                'IDgen_mst_Departement' => 1, // Médecine Interne
            ]);
        }
    }
}