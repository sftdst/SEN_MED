<?php

namespace Database\Seeders;

use App\Models\WebAbout;
use Illuminate\Database\Seeder;

class WebAboutSeeder extends Seeder
{
    public function run(): void
    {
        WebAbout::firstOrCreate(
            ['id' => 1],
            [
                'title' => 'Qui sommes-nous ?',
                'content' => 'SenMed accompagne les structures de santé dans une prise en charge plus fluide, plus humaine et mieux organisée. Notre mission est de rapprocher les patients des bons services, au bon moment.',
                'stat_1_value' => '24/7',
                'stat_1_label' => 'Orientation patient',
                'stat_2_value' => '+30',
                'stat_2_label' => 'Services coordonnés',
                'stat_3_value' => '100%',
                'stat_3_label' => 'Suivi structure',
                'is_active' => true,
            ]
        );
    }
}