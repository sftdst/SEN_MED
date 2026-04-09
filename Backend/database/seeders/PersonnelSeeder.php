<?php

namespace Database\Seeders;

use App\Models\Personnel;
use Illuminate\Database\Seeder;

class PersonnelSeeder extends Seeder
{
    public function run(): void
    {
        Personnel::create([
            'user_id' => '1',
            'staff_name' => 'Dr. Amadou Diallo',
            'status_id' => 1,
            'gender_id' => 'masculin',
            'created_user_id' => 'admin',
            'created_dttm' => now(),
            'user_name' => 'amadou.diallo',
            'email_adress' => 'amadou.diallo@example.com',
            'date_of_birth' => '1980-05-15',
            'staff_type' => 'medecin',
            'contact_number' => '771234567',
            'specialization' => 'Médecine Interne',
            'first_name' => 'Amadou',
            'last_name' => 'Diallo',
            'nationality_id' => 1,
            'address' => 'Rue 1, Dakar',
            'phone_number' => '771234567',
            'Joining_date' => '2020-01-01',
            'city' => 'Dakar',
            'groupe_sanguin' => 'O+',
            'personnel' => 1,
            'consult' => 1,
            'IDgen_mst_Departement' => 1,
        ]);

        Personnel::create([
            'user_id' => '2',
            'staff_name' => 'Infirmière Fatou Ndiaye',
            'status_id' => 1,
            'gender_id' => 'feminin',
            'created_user_id' => 'admin',
            'created_dttm' => now(),
            'user_name' => 'fatou.ndiaye',
            'email_adress' => 'fatou.ndiaye@example.com',
            'date_of_birth' => '1985-08-20',
            'staff_type' => 'infirmier',
            'contact_number' => '779876543',
            'specialization' => 'Soins Intensifs',
            'first_name' => 'Fatou',
            'last_name' => 'Ndiaye',
            'nationality_id' => 1,
            'address' => 'Rue 2, Dakar',
            'phone_number' => '779876543',
            'Joining_date' => '2019-03-15',
            'city' => 'Dakar',
            'groupe_sanguin' => 'A+',
            'personnel' => 1,
            'consult' => 0,
            'IDgen_mst_Departement' => 2,
        ]);
    }
}