<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        \DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Hospital::truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $hospitals = [
            ['Hospital_id' => 1, 'hospital_name' => 'Hôpital Général de Dakar', 'short_name' => 'HGD', 'adress' => 'Rue de l\'Hôpital, Dakar', 'postal_code' => '12345', 'zip_code' => 'Dakar 12345', 'fax' => '123-456-7890', 'mobile_number' => '+221 77 123 45 67', 'contact_number' => '+221 33 123 45 67', 'email_address' => 'contact@hgd.sn', 'website' => 'https://www.hgd.sn', 'status_id' => 1, 'logo' => 'logo.png', 'type_cabinet' => 'Général'],
            ['Hospital_id' => 2, 'hospital_name' => 'Clinique Sainte-Marie', 'short_name' => 'CSM', 'adress' => 'Avenue de la Paix, Dakar', 'postal_code' => '67890', 'zip_code' => 'Dakar 67890', 'fax' => '987-654-3210', 'mobile_number' => '+221 77 987 65 43', 'contact_number' => '+221 33 987 65 43', 'email_address' => 'info@csm.sn', 'website' => 'https://www.csm.sn', 'status_id' => 1, 'logo' => 'logo2.png', 'type_cabinet' => 'Privé'],
            ['Hospital_id' => 3, 'hospital_name' => 'Centre Hospitalier de Thiès', 'short_name' => 'CHT', 'adress' => 'Boulevard du Lycée, Thiès', 'postal_code' => '21000', 'zip_code' => 'Thiès 21000', 'fax' => '251-234-567', 'mobile_number' => '+221 77 234 56 78', 'contact_number' => '+221 33 234 56 78', 'email_address' => 'contact@cht.sn', 'website' => 'https://www.cht.sn', 'status_id' => 1, 'logo' => 'cht.png', 'type_cabinet' => 'Général'],
            ['Hospital_id' => 4, 'hospital_name' => 'Hôpital Regional de Saint-Louis', 'short_name' => 'HRS', 'adress' => 'Rue de la Gare, Saint-Louis', 'postal_code' => '11000', 'zip_code' => 'Saint-Louis 11000', 'fax' => '961-123-456', 'mobile_number' => '+221 77 111 22 33', 'contact_number' => '+221 33 111 22 33', 'email_address' => 'info@hrs.sn', 'website' => 'https://www.hrs.sn', 'status_id' => 1, 'logo' => 'hrs.png', 'type_cabinet' => 'Régional'],
            ['Hospital_id' => 5, 'hospital_name' => 'Clinique les Ocades', 'short_name' => 'CLO', 'adress' => 'Point E, Dakar', 'postal_code' => '12500', 'zip_code' => 'Dakar 12500', 'fax' => '338-654-321', 'mobile_number' => '+221 77 555 66 77', 'contact_number' => '+221 33 555 66 77', 'email_address' => 'contact@clo.sn', 'website' => 'https://www.clo.sn', 'status_id' => 1, 'logo' => 'clo.png', 'type_cabinet' => 'Privé'],
        ];

        foreach ($hospitals as $hospital) {
            Hospital::updateOrCreate(['Hospital_id' => $hospital['Hospital_id']], $hospital);
        }
    }
}