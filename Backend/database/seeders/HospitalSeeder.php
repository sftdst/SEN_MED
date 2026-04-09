<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        Hospital::create([
            'Hospital_id' => 1,
            'hospital_name' => 'Hôpital Général de Dakar',
            'short_name' => 'HGD',
            'adress' => 'Rue de l\'Hôpital, Dakar',
            'postal_code' => '12345',
            'zip_code' => ' Dakar 12345',
            'fax' => '123-456-7890',
            'mobile_number' => '+221 77 123 45 67',
            'contact_number' => '+221 33 123 45 67',
            'email_address' => 'contact@hgd.sn',
            'website' => 'https://www.hgd.sn',
            'status_id' => 1,
            'logo' => 'logo.png',
            'type_cabinet' => 'Général',
        ]);

        Hospital::create([
            'Hospital_id' => 2,
            'hospital_name' => 'Clinique Sainte-Marie',
            'short_name' => 'CSM',
            'adress' => 'Avenue de la Paix, Dakar',
            'postal_code' => '67890',
            'zip_code' => 'Dakar 67890',
            'fax' => '987-654-3210',
            'mobile_number' => '+221 77 987 65 43',
            'contact_number' => '+221 33 987 65 43',
            'email_address' => 'info@csm.sn',
            'website' => 'https://www.csm.sn',
            'status_id' => 1,
            'logo' => 'logo2.png',
            'type_cabinet' => 'Privé',
        ]);
    }
}