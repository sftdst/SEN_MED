<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\PartenaireHeader;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PatientSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $partenaires = PartenaireHeader::pluck('id_Rep')->toArray();
        $patients = [
            ['first_name' => 'Aminata', 'last_name' => 'Diop', 'dob' => '1988-03-15', 'gender_id' => 'F', 'mobile_number' => '221771234567', 'company_id' => $partenaires[array_rand($partenaires)] ?? null, 'type_couverture' => 'Premium'],
            ['first_name' => 'Moussa', 'last_name' => 'Fall', 'dob' => '1995-07-22', 'gender_id' => 'M', 'mobile_number' => '221762345678', 'company_id' => $partenaires[array_rand($partenaires)] ?? null, 'type_couverture' => 'Standard'],
            ['first_name' => 'Fatou', 'last_name' => 'Ndiaye', 'dob' => '2002-11-05', 'gender_id' => 'F', 'mobile_number' => '221709876543', 'company_id' => $partenaires[array_rand($partenaires)] ?? null, 'type_couverture' => 'Chirurgie'],
            ['first_name' => 'Ousmane', 'last_name' => 'Sow', 'dob' => '1979-01-30', 'gender_id' => 'M', 'mobile_number' => '221783456789', 'company_id' => $partenaires[array_rand($partenaires)] ?? null, 'type_couverture' => 'Base'],
            ['first_name' => 'Mariama', 'last_name' => 'Sarr', 'dob' => '1990-08-18', 'gender_id' => 'F', 'mobile_number' => '221768765432', 'company_id' => $partenaires[array_rand($partenaires)] ?? null, 'type_couverture' => 'Pharmacie'],
            ['first_name' => 'Cheikh', 'last_name' => 'Ba', 'dob' => '1983-05-10', 'gender_id' => 'M', 'mobile_number' => '221776543210', 'company_id' => null, 'type_couverture' => null],
            ['first_name' => 'Adama', 'last_name' => 'Gaye', 'dob' => '2000-12-01', 'gender_id' => 'F', 'mobile_number' => '221782109876', 'company_id' => $partenaires[array_rand($partenaires)] ?? null, 'type_couverture' => 'Premium'],
            ['first_name' => 'Ibrahima', 'last_name' => 'Diaw', 'dob' => '1987-06-14', 'gender_id' => 'M', 'mobile_number' => '221765432109', 'company_id' => null, 'type_couverture' => null],
            ['first_name' => 'Khadija', 'last_name' => 'Cissé', 'dob' => '1998-02-02', 'gender_id' => 'F', 'mobile_number' => '221778901234', 'company_id' => $partenaires[array_rand($partenaires)] ?? null, 'type_couverture' => 'Standard'],
            ['first_name' => 'Babacar', 'last_name' => 'Lô', 'dob' => '1975-09-29', 'gender_id' => 'M', 'mobile_number' => '221703214567', 'company_id' => $partenaires[array_rand($partenaires)] ?? null, 'type_couverture' => 'Base'],
        ];

        foreach ($patients as $index => $item) {
            Patient::create([
                'patient_id'          => 'PAT-' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                'patient_code'        => 'P' . str_pad($index + 1, 9, '0', STR_PAD_LEFT),
                'first_name'          => $item['first_name'],
                'last_name'           => $item['last_name'],
                'patient_name'        => $item['first_name'] . ' ' . $item['last_name'],
                'gender_id'           => $item['gender_id'],
                'dob'                 => Carbon::parse($item['dob']),
                'age_patient'         => Carbon::parse($item['dob'])->age,
                'mobile_number'       => $item['mobile_number'],
                'company_id'          => $item['company_id'],
                'type_couverture'     => $item['type_couverture'],
                'status_id'           => 1,
                'created_user_id'     => 'SEED',
                'created_dttm'        => now(),
                'pending_amount'      => 0,
            ]);
        }
    }
}
