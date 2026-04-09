<?php

namespace Database\Seeders;

use App\Models\PartenaireDtl;
use App\Models\PartenaireHeader;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PartenaireHeaderSeeder extends Seeder
{
    public function run(): void
    {
        // ── Données partenaires ────────────────────────────────────────────────
        $partenaires = [

            // ── ASSURANCES ────────────────────────────────────────────────────
            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-SAA-001',
                    'Nom'            => 'Société Africaine d\'Assurance (SAA)',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => '12 Avenue Lamine Guèye, Plateau',
                    'contact'        => 'Amadou Diallo',
                    'mobile'         => '+221 77 123 45 67',
                    'bank'           => 'CBAO',
                    'email'          => 'contact@saa.sn',
                    'type_societe'   => 'SA',
                    'numero_compte'  => '10500002000456789012',
                    'maximum_credit' => 50_000_000,
                    'date_created'   => '2022-01-15',
                    'code_societe'   => 'SAA-001',
                    'status'         => true,
                    'TypePart'       => 0,
                ],
                'couvertures' => [
                    ['Nom' => 'Couverture Premium 100%',    'service' => 'Toutes prestations',       'contributionCompagny' => 100, 'contributionPatient' => 0,  'Maximum_Credit' => 15_000_000],
                    ['Nom' => 'Couverture Standard 80/20',  'service' => 'Consultation & Médecine',  'contributionCompagny' => 80,  'contributionPatient' => 20, 'Maximum_Credit' => 20_000_000],
                    ['Nom' => 'Couverture Chirurgie 70/30', 'service' => 'Chirurgie & Imagerie',     'contributionCompagny' => 70,  'contributionPatient' => 30, 'Maximum_Credit' => 10_000_000],
                ],
            ],

            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-AIG-002',
                    'Nom'            => 'African Insurance Group (AIG)',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => '45 Boulevard de la République',
                    'contact'        => 'Fatou Ndiaye',
                    'mobile'         => '+221 77 234 56 78',
                    'bank'           => 'SGBS',
                    'email'          => 'info@aig.sn',
                    'type_societe'   => 'SA',
                    'numero_compte'  => '10550001000678901234',
                    'maximum_credit' => 75_000_000,
                    'date_created'   => '2021-06-01',
                    'code_societe'   => 'AIG-002',
                    'status'         => true,
                    'TypePart'       => 0,
                ],
                'couvertures' => [
                    ['Nom' => 'Gold – Hospitalisation complète', 'service' => 'Hospitalisation',         'contributionCompagny' => 90, 'contributionPatient' => 10, 'Maximum_Credit' => 30_000_000],
                    ['Nom' => 'Silver – Ambulatoire',            'service' => 'Consultation externe',    'contributionCompagny' => 75, 'contributionPatient' => 25, 'Maximum_Credit' => 25_000_000],
                    ['Nom' => 'Bronze – Pharmacie',              'service' => 'Médicaments',             'contributionCompagny' => 60, 'contributionPatient' => 40, 'Maximum_Credit' => 10_000_000],
                    ['Nom' => 'Dentaire & Optique',              'service' => 'Soins dentaires/optique', 'contributionCompagny' => 50, 'contributionPatient' => 50, 'Maximum_Credit' =>  8_000_000],
                ],
            ],

            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-NSIA-003',
                    'Nom'            => 'NSIA Assurances Sénégal',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => '2 Place de l\'Indépendance, Dakar',
                    'contact'        => 'Moussa Kamara',
                    'mobile'         => '+221 77 111 22 33',
                    'bank'           => 'BHS',
                    'email'          => 'senegal@nsia.sn',
                    'type_societe'   => 'SA',
                    'numero_compte'  => '10600003000111222333',
                    'maximum_credit' => 40_000_000,
                    'date_created'   => '2023-03-10',
                    'code_societe'   => 'NSIA-003',
                    'status'         => true,
                    'TypePart'       => 0,
                ],
                'couvertures' => [
                    ['Nom' => 'Plan Famille 80/20',    'service' => 'Toutes prestations',    'contributionCompagny' => 80, 'contributionPatient' => 20, 'Maximum_Credit' => 20_000_000],
                    ['Nom' => 'Plan Maternité 100%',   'service' => 'Obstétrique/Maternité', 'contributionCompagny' => 100,'contributionPatient' => 0,  'Maximum_Credit' => 12_000_000],
                ],
            ],

            // ── MUTUELLES ─────────────────────────────────────────────────────
            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-MSS-004',
                    'Nom'            => 'Mutuelle de Santé du Sénégal (MSS)',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => '78 Rue Jules Coly, Dakar',
                    'contact'        => 'Ousmane Sow',
                    'mobile'         => '+221 77 345 67 89',
                    'bank'           => 'ECOBANK',
                    'email'          => 'contact@mss.sn',
                    'type_societe'   => 'SARL',
                    'numero_compte'  => '20650003000234567890',
                    'maximum_credit' => 30_000_000,
                    'date_created'   => '2020-09-01',
                    'code_societe'   => 'MSS-004',
                    'status'         => true,
                    'TypePart'       => 1,
                ],
                'couvertures' => [
                    ['Nom' => 'Couverture de base 60/40',      'service' => 'Consultation générale',  'contributionCompagny' => 60, 'contributionPatient' => 40, 'Maximum_Credit' => 10_000_000],
                    ['Nom' => 'Couverture chirurgicale 70/30', 'service' => 'Chirurgie',              'contributionCompagny' => 70, 'contributionPatient' => 30, 'Maximum_Credit' => 12_000_000],
                    ['Nom' => 'Couverture pharmacie 50/50',    'service' => 'Pharmacie',              'contributionCompagny' => 50, 'contributionPatient' => 50, 'Maximum_Credit' =>  5_000_000],
                ],
            ],

            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-MUSP-005',
                    'Nom'            => 'Mutuelle Sénégalaise de Protection (MUSP)',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Thiès',
                    'adress'         => '32 Avenue Peytavin, Thiès',
                    'contact'        => 'Miriam Ba',
                    'mobile'         => '+221 77 456 78 90',
                    'bank'           => 'BOA',
                    'email'          => 'info@musp.sn',
                    'type_societe'   => 'SARL',
                    'numero_compte'  => '20700002000456789012',
                    'maximum_credit' => 25_000_000,
                    'date_created'   => '2021-11-20',
                    'code_societe'   => 'MUSP-005',
                    'status'         => true,
                    'TypePart'       => 1,
                ],
                'couvertures' => [
                    ['Nom' => 'Adhérent standard 70/30',   'service' => 'Médecine générale',  'contributionCompagny' => 70, 'contributionPatient' => 30, 'Maximum_Credit' => 10_000_000],
                    ['Nom' => 'Spécialistes 60/40',        'service' => 'Spécialités',         'contributionCompagny' => 60, 'contributionPatient' => 40, 'Maximum_Credit' =>  8_000_000],
                ],
            ],

            // ── ENTREPRISES ───────────────────────────────────────────────────
            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-SONATEL-006',
                    'Nom'            => 'SONATEL (Orange Sénégal)',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => '12 Emile Badiane, Hann Maristes',
                    'contact'        => 'DRH Santé',
                    'mobile'         => '+221 33 839 00 00',
                    'bank'           => 'CBAO',
                    'email'          => 'drh@orange-sonatel.com',
                    'type_societe'   => 'SA',
                    'numero_compte'  => '30800004000123456789',
                    'maximum_credit' => 80_000_000,
                    'date_created'   => '2019-01-01',
                    'code_societe'   => 'SONT-006',
                    'status'         => true,
                    'TypePart'       => 2,
                ],
                'couvertures' => [
                    ['Nom' => 'Cadres – Couverture 100%',         'service' => 'Toutes prestations',         'contributionCompagny' => 100, 'contributionPatient' => 0,  'Maximum_Credit' => 30_000_000],
                    ['Nom' => 'Agents – Couverture 80/20',        'service' => 'Consultation & Médecine',    'contributionCompagny' => 80,  'contributionPatient' => 20, 'Maximum_Credit' => 25_000_000],
                    ['Nom' => 'Famille – Hospitalisation 90/10',  'service' => 'Hospitalisation',            'contributionCompagny' => 90,  'contributionPatient' => 10, 'Maximum_Credit' => 15_000_000],
                    ['Nom' => 'Optique & Dentaire 50/50',         'service' => 'Soins dentaires/optique',   'contributionCompagny' => 50,  'contributionPatient' => 50, 'Maximum_Credit' =>  8_000_000],
                ],
            ],

            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-SENELEC-007',
                    'Nom'            => 'SENELEC',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => '28 Rue Vincent, Dakar Plateau',
                    'contact'        => 'Service RH',
                    'mobile'         => '+221 33 839 30 00',
                    'bank'           => 'SGBS',
                    'email'          => 'rh@senelec.sn',
                    'type_societe'   => 'SA',
                    'numero_compte'  => '30900005000345678901',
                    'maximum_credit' => 60_000_000,
                    'date_created'   => '2020-03-15',
                    'code_societe'   => 'SENEL-007',
                    'status'         => true,
                    'TypePart'       => 2,
                ],
                'couvertures' => [
                    ['Nom' => 'Personnel permanent 85/15',  'service' => 'Toutes prestations',   'contributionCompagny' => 85, 'contributionPatient' => 15, 'Maximum_Credit' => 35_000_000],
                    ['Nom' => 'Contractuel 65/35',          'service' => 'Consultation/Urgences', 'contributionCompagny' => 65, 'contributionPatient' => 35, 'Maximum_Credit' => 15_000_000],
                    ['Nom' => 'Maternité 100%',             'service' => 'Obstétrique',           'contributionCompagny' => 100,'contributionPatient' => 0,  'Maximum_Credit' =>  8_000_000],
                ],
            ],

            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-DANGOTE-008',
                    'Nom'            => 'Dangote Industries Sénégal',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => 'Zone Industrielle de Diamniadio',
                    'contact'        => 'Abdou Fall',
                    'mobile'         => '+221 77 555 44 33',
                    'bank'           => 'UBA',
                    'email'          => 'health@dangote.sn',
                    'type_societe'   => 'SA',
                    'numero_compte'  => '31000006000567890123',
                    'maximum_credit' => 45_000_000,
                    'date_created'   => '2023-07-01',
                    'code_societe'   => 'DANG-008',
                    'status'         => true,
                    'TypePart'       => 2,
                ],
                'couvertures' => [
                    ['Nom' => 'Ouvriers – Standard 60/40',  'service' => 'Médecine du travail',  'contributionCompagny' => 60, 'contributionPatient' => 40, 'Maximum_Credit' => 15_000_000],
                    ['Nom' => 'Cadres – Premium 90/10',     'service' => 'Toutes prestations',   'contributionCompagny' => 90, 'contributionPatient' => 10, 'Maximum_Credit' => 25_000_000],
                ],
            ],

            // ── ORGANISATIONS ─────────────────────────────────────────────────
            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-OMS-009',
                    'Nom'            => 'Organisation Mondiale de la Santé – Bureau Sénégal',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => 'Point E, Rue Aimé Césaire',
                    'contact'        => 'Dr. Jean-Marie Luc',
                    'mobile'         => '+221 33 869 27 00',
                    'bank'           => 'BICIS',
                    'email'          => 'afr-sn@who.int',
                    'type_societe'   => 'GIE',
                    'numero_compte'  => '40000007000678901234',
                    'maximum_credit' => 100_000_000,
                    'date_created'   => '2018-01-01',
                    'code_societe'   => 'OMS-009',
                    'status'         => true,
                    'TypePart'       => 3,
                ],
                'couvertures' => [
                    ['Nom' => 'Personnel international 100%', 'service' => 'Toutes prestations',  'contributionCompagny' => 100, 'contributionPatient' => 0,  'Maximum_Credit' => 50_000_000],
                    ['Nom' => 'Personnel local 80/20',        'service' => 'Hospitalisation',     'contributionCompagny' => 80,  'contributionPatient' => 20, 'Maximum_Credit' => 30_000_000],
                    ['Nom' => 'Consultants 70/30',            'service' => 'Soins ambulatoires',  'contributionCompagny' => 70,  'contributionPatient' => 30, 'Maximum_Credit' => 15_000_000],
                ],
            ],

            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-CNAM-010',
                    'Nom'            => 'CNAM – Caisse Nationale d\'Assurance Maladie',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Dakar',
                    'adress'         => '11 Rue Carnot, Dakar',
                    'contact'        => 'Directeur CNAM',
                    'mobile'         => '+221 33 889 12 34',
                    'bank'           => 'BNDE',
                    'email'          => 'direction@cnam.sn',
                    'type_societe'   => 'GIE',
                    'numero_compte'  => '40100008000789012345',
                    'maximum_credit' => 200_000_000,
                    'date_created'   => '2015-06-01',
                    'code_societe'   => 'CNAM-010',
                    'status'         => true,
                    'TypePart'       => 3,
                ],
                'couvertures' => [
                    ['Nom' => 'CMU – Couverture de base',         'service' => 'Soins primaires',           'contributionCompagny' => 75, 'contributionPatient' => 25, 'Maximum_Credit' =>  80_000_000],
                    ['Nom' => 'CMU – Maternité gratuite',         'service' => 'Obstétrique/accouchement',  'contributionCompagny' => 100,'contributionPatient' => 0,  'Maximum_Credit' =>  50_000_000],
                    ['Nom' => 'CMU – Chirurgie essentielle',      'service' => 'Chirurgie',                 'contributionCompagny' => 80, 'contributionPatient' => 20, 'Maximum_Credit' =>  40_000_000],
                    ['Nom' => 'CMU – Diabète & HTA',              'service' => 'Maladies chroniques',       'contributionCompagny' => 90, 'contributionPatient' => 10, 'Maximum_Credit' =>  20_000_000],
                ],
            ],

            // ── AUTRE ─────────────────────────────────────────────────────────
            [
                'header' => [
                    'id_gen_partenaire' => 'PAR-FOND-011',
                    'Nom'            => 'Fondation Teranga Santé',
                    'pays'           => 'Sénégal',
                    'ville'          => 'Saint-Louis',
                    'adress'         => 'Quartier Nord, Saint-Louis',
                    'contact'        => 'Bineta Diallo',
                    'mobile'         => '+221 77 999 00 11',
                    'bank'           => 'BOA',
                    'email'          => 'contact@teranga-sante.org',
                    'type_societe'   => 'autre',
                    'numero_compte'  => '50000009000890123456',
                    'maximum_credit' => 15_000_000,
                    'date_created'   => '2022-05-01',
                    'code_societe'   => 'FOND-011',
                    'status'         => true,
                    'TypePart'       => 4,
                ],
                'couvertures' => [
                    ['Nom' => 'Prise en charge indigents 100%', 'service' => 'Soins primaires', 'contributionCompagny' => 100, 'contributionPatient' => 0, 'Maximum_Credit' => 10_000_000],
                    ['Nom' => 'Prise en charge partielle 80%',  'service' => 'Pharmacie',       'contributionCompagny' => 80,  'contributionPatient' => 20,'Maximum_Credit' =>  4_000_000],
                ],
            ],
        ];

        // ── Insertion ──────────────────────────────────────────────────────────
        foreach ($partenaires as $data) {
            $header = PartenaireHeader::create($data['header']);

            foreach ($data['couvertures'] as $cov) {
                PartenaireDtl::create([
                    ...$cov,
                    'Id_gen_partenaire' => $header->id_gen_partenaire,
                    'id_partenaire_dtl' => 'COV-' . strtoupper(Str::random(7)),
                ]);
            }
        }
    }
}
