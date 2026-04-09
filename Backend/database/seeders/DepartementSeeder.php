<?php

namespace Database\Seeders;

use App\Models\Departement;
use Illuminate\Database\Seeder;

class DepartementSeeder extends Seeder
{
    public function run(): void
    {
        Departement::create([
            'NomDepartement' => 'Médecine Interne',
            'description' => 'Département de médecine interne',
            'status' => 1,
            'Hospital_id' => 1,
        ]);

        Departement::create([
            'NomDepartement' => 'Chirurgie',
            'description' => 'Département de chirurgie',
            'status' => 1,
            'Hospital_id' => 1,
        ]);

        Departement::create([
            'NomDepartement' => 'Pédiatrie',
            'description' => 'Département de pédiatrie',
            'status' => 1,
            'Hospital_id' => 2,
        ]);
    }
}