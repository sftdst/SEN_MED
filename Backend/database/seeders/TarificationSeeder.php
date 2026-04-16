<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TarificationSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Compléter les services existants + en ajouter ────────────────────
        $this->seedServices();

        // ── 2. Ajouter des médecins ─────────────────────────────────────────────
        $this->seedMedecins();

        // ── 3. Insérer les tarifs médecins ──────────────────────────────────────
        $this->seedTarifsMedecins();

        $this->command->info('✅ TarificationSeeder terminé.');
    }

    // ────────────────────────────────────────────────────────────────────────────
    private function seedServices(): void
    {
        // Mettre à jour les 2 services existants avec majoration fériée
        DB::table('gen_mst_service')->where('id_service', 1)->update([
            'valeur_cts'       => '15000',
            'majoration_ferie' => '25',
            'updated_at'       => now(),
        ]);
        DB::table('gen_mst_service')->where('id_service', 2)->update([
            'valeur_cts'       => '45000',
            'majoration_ferie' => '30',
            'updated_at'       => now(),
        ]);

        // Nouveaux services
        $services = [
            [
                'id_gen_mst_service'    => 'SVC003',
                'n_ordre'               => '3',
                'short_name'            => 'Échographie',
                'tri_name'              => 'ECHOGRAPHIE',
                'code_local'            => 'ECH001',
                'cle_tarif_service'     => 'TARIF003',
                'groupe_id'             => '2',
                'categorie_id'          => '2',
                'type_categorie'        => 'Imagerie',
                'status'                => 1,
                'valeur_cts'            => '30000',
                'majoration_ferie'      => '20',
                'IDgen_mst_Type_Service'=> 2,
            ],
            [
                'id_gen_mst_service'    => 'SVC004',
                'n_ordre'               => '4',
                'short_name'            => 'Analyse de sang',
                'tri_name'              => 'ANALYSE SANG',
                'code_local'            => 'LAB001',
                'cle_tarif_service'     => 'TARIF004',
                'groupe_id'             => '3',
                'categorie_id'          => '3',
                'type_categorie'        => 'Laboratoire',
                'status'                => 1,
                'valeur_cts'            => '8000',
                'majoration_ferie'      => '15',
                'IDgen_mst_Type_Service'=> 1,
            ],
            [
                'id_gen_mst_service'    => 'SVC005',
                'n_ordre'               => '5',
                'short_name'            => 'Consultation Spécialisée',
                'tri_name'              => 'CONSULTATION SPECIALISEE',
                'code_local'            => 'CSP001',
                'cle_tarif_service'     => 'TARIF005',
                'groupe_id'             => '1',
                'categorie_id'          => '1',
                'type_categorie'        => 'Consultation',
                'status'                => 1,
                'valeur_cts'            => '25000',
                'majoration_ferie'      => '30',
                'IDgen_mst_Type_Service'=> 1,
            ],
            [
                'id_gen_mst_service'    => 'SVC006',
                'n_ordre'               => '6',
                'short_name'            => 'Acte chirurgical mineur',
                'tri_name'              => 'CHIRURGIE MINEURE',
                'code_local'            => 'CHI001',
                'cle_tarif_service'     => 'TARIF006',
                'groupe_id'             => '4',
                'categorie_id'          => '4',
                'type_categorie'        => 'Chirurgie',
                'status'                => 1,
                'valeur_cts'            => '75000',
                'majoration_ferie'      => '50',
                'IDgen_mst_Type_Service'=> 2,
            ],
            [
                'id_gen_mst_service'    => 'SVC007',
                'n_ordre'               => '7',
                'short_name'            => 'Soins infirmiers',
                'tri_name'              => 'SOINS INFIRMIERS',
                'code_local'            => 'INF001',
                'cle_tarif_service'     => 'TARIF007',
                'groupe_id'             => '1',
                'categorie_id'          => '1',
                'type_categorie'        => 'Soins',
                'status'                => 1,
                'valeur_cts'            => '5000',
                'majoration_ferie'      => '10',
                'IDgen_mst_Type_Service'=> 1,
            ],
            [
                'id_gen_mst_service'    => 'SVC008',
                'n_ordre'               => '8',
                'short_name'            => 'Hospitalisation/jour',
                'tri_name'              => 'HOSPITALISATION JOURNALIERE',
                'code_local'            => 'HOS001',
                'cle_tarif_service'     => 'TARIF008',
                'groupe_id'             => '5',
                'categorie_id'          => '5',
                'type_categorie'        => 'Hospitalisation',
                'status'                => 1,
                'valeur_cts'            => '35000',
                'majoration_ferie'      => '0',
                'IDgen_mst_Type_Service'=> 2,
            ],
            [
                'id_gen_mst_service'    => 'SVC009',
                'n_ordre'               => '9',
                'short_name'            => 'Electrocardiogramme',
                'tri_name'              => 'ECG',
                'code_local'            => 'ECG001',
                'cle_tarif_service'     => 'TARIF009',
                'groupe_id'             => '2',
                'categorie_id'          => '2',
                'type_categorie'        => 'Exploration',
                'status'                => 1,
                'valeur_cts'            => '12000',
                'majoration_ferie'      => '20',
                'IDgen_mst_Type_Service'=> 1,
            ],
            [
                'id_gen_mst_service'    => 'SVC010',
                'n_ordre'               => '10',
                'short_name'            => 'Consultation Urgence',
                'tri_name'              => 'URGENCE',
                'code_local'            => 'URG001',
                'cle_tarif_service'     => 'TARIF010',
                'groupe_id'             => '1',
                'categorie_id'          => '1',
                'type_categorie'        => 'Urgence',
                'status'                => 1,
                'valeur_cts'            => '20000',
                'majoration_ferie'      => '50',
                'IDgen_mst_Type_Service'=> 1,
            ],
        ];

        foreach ($services as $svc) {
            $exists = DB::table('gen_mst_service')
                ->where('code_local', $svc['code_local'])
                ->exists();
            if (!$exists) {
                DB::table('gen_mst_service')->insert(array_merge($svc, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        $this->command->info('  → ' . DB::table('gen_mst_service')->count() . ' services au total');
    }

    // ────────────────────────────────────────────────────────────────────────────
    private function seedMedecins(): void
    {
        $now = now();
        $medecins = [
            [
                'user_id'                => '3',
                'staff_name'             => 'Dr. Mariama Sarr',
                'first_name'             => 'Mariama',
                'last_name'              => 'Sarr',
                'staff_type'             => 'medecin',
                'specialization'         => 'Pédiatrie',
                'email_adress'           => 'mariama.sarr@senmed.sn',
                'user_name'              => 'mariama.sarr',
                'gender_id'              => 'feminin',
                'status_id'              => 1,
                'contact_number'         => '771112233',
                'phone_number'           => '771112233',
                'address'                => 'Mermoz, Dakar',
                'city'                   => 'Dakar',
                'date_of_birth'          => '1978-03-22',
                'Joining_date'           => '2018-06-01',
                'nationality_id'         => 1,
                'IDgen_mst_Departement'  => 3,
                'consult'                => 1,
                'personnel'              => 1,
                'created_user_id'        => 'admin',
                'created_dttm'           => $now,
                'created_at'             => $now,
                'updated_at'             => $now,
            ],
            [
                'user_id'                => '4',
                'staff_name'             => 'Dr. Cheikh Bassirou',
                'first_name'             => 'Cheikh',
                'last_name'              => 'Bassirou',
                'staff_type'             => 'medecin',
                'specialization'         => 'Chirurgie Générale',
                'email_adress'           => 'cheikh.bassirou@senmed.sn',
                'user_name'              => 'cheikh.bassirou',
                'gender_id'              => 'masculin',
                'status_id'              => 1,
                'contact_number'         => '774455667',
                'phone_number'           => '774455667',
                'address'                => 'Ouakam, Dakar',
                'city'                   => 'Dakar',
                'date_of_birth'          => '1982-11-08',
                'Joining_date'           => '2017-09-15',
                'nationality_id'         => 1,
                'IDgen_mst_Departement'  => 2,
                'consult'                => 1,
                'personnel'              => 1,
                'created_user_id'        => 'admin',
                'created_dttm'           => $now,
                'created_at'             => $now,
                'updated_at'             => $now,
            ],
            [
                'user_id'                => '5',
                'staff_name'             => 'Dr. Aïda Mbaye',
                'first_name'             => 'Aïda',
                'last_name'              => 'Mbaye',
                'staff_type'             => 'medecin',
                'specialization'         => 'Gynécologie',
                'email_adress'           => 'aida.mbaye@senmed.sn',
                'user_name'              => 'aida.mbaye',
                'gender_id'              => 'feminin',
                'status_id'              => 1,
                'contact_number'         => '778899001',
                'phone_number'           => '778899001',
                'address'                => 'Keur Gorgui, Dakar',
                'city'                   => 'Dakar',
                'date_of_birth'          => '1984-04-30',
                'Joining_date'           => '2019-08-20',
                'nationality_id'         => 1,
                'IDgen_mst_Departement'  => 1,
                'consult'                => 1,
                'personnel'              => 1,
                'created_user_id'        => 'admin',
                'created_dttm'           => $now,
                'created_at'             => $now,
                'updated_at'             => $now,
            ],
            [
                'user_id'                => '6',
                'staff_name'             => 'Dr. Babacar Seck',
                'first_name'             => 'Babacar',
                'last_name'              => 'Seck',
                'staff_type'             => 'medecin',
                'specialization'         => 'Cardiologie',
                'email_adress'           => 'babacar.seck@senmed.sn',
                'user_name'              => 'babacar.seck',
                'gender_id'              => 'masculin',
                'status_id'              => 1,
                'contact_number'         => '772233445',
                'phone_number'           => '772233445',
                'address'                => 'Ngor, Dakar',
                'city'                   => 'Dakar',
                'date_of_birth'          => '1975-12-25',
                'Joining_date'           => '2016-01-10',
                'nationality_id'         => 1,
                'IDgen_mst_Departement'  => 1,
                'consult'                => 1,
                'personnel'              => 1,
                'created_user_id'        => 'admin',
                'created_dttm'           => $now,
                'created_at'             => $now,
                'updated_at'             => $now,
            ],
        ];

        foreach ($medecins as $m) {
            $exists = DB::table('hr_mst_user')
                ->where('user_id', $m['user_id'])
                ->exists();
            if (!$exists) {
                DB::table('hr_mst_user')->insert($m);
            }
        }

        $this->command->info('  → ' . DB::table('hr_mst_user')->where('staff_type', 'medecin')->count() . ' médecins au total');
    }

    // ────────────────────────────────────────────────────────────────────────────
    private function seedTarifsMedecins(): void
    {
        $now = now();

        // Dr. Amadou Diallo (user_id=1) — Médecine Interne
        // Tarif personnalisé sur Consultation Générale + Consultation Spécialisée
        $tarifs = [
            // Dr. Amadou Diallo
            [
                'medecin_id'       => '1',
                'service_id'       => 1,   // Consultation Générale (hôpital: 15 000 → médecin: 18 000)
                'prix_service'     => 18000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'Tarif senior médecine interne',
            ],
            [
                'medecin_id'       => '1',
                'service_id'       => 5,   // Consultation Spécialisée (hôpital: 25 000 → médecin: 30 000)
                'prix_service'     => 30000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],
            [
                'medecin_id'       => '1',
                'service_id'       => 9,   // ECG (hôpital: 12 000 → médecin: 15 000)
                'prix_service'     => 15000,
                'majoration_ferie' => 2000,
                'type_majoration'  => 'montant_fixe',
                'actif'            => true,
                'note'             => 'Majoration fixe weekend férié',
            ],

            // Dr. Cheikh Bassirou (user_id=4) — Chirurgie Générale
            [
                'medecin_id'       => '4',
                'service_id'       => 1,   // Consultation Générale
                'prix_service'     => null, // Utilise le tarif hôpital
                'majoration_ferie' => 50,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'Majoration fériée chirurgien',
            ],
            [
                'medecin_id'       => '4',
                'service_id'       => 6,   // Acte chirurgical mineur (hôpital: 75 000 → médecin: 90 000)
                'prix_service'     => 90000,
                'majoration_ferie' => 75,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'Tarif acte chirurgical Dr. Bassirou',
            ],
            [
                'medecin_id'       => '4',
                'service_id'       => 5,   // Consultation Spécialisée (hôpital: 25 000 → médecin: 35 000)
                'prix_service'     => 35000,
                'majoration_ferie' => 50,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],

            // Dr. Aïda Mbaye (user_id=5) — Gynécologie
            [
                'medecin_id'       => '5',
                'service_id'       => 1,   // Consultation Générale
                'prix_service'     => 20000,
                'majoration_ferie' => 25,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],
            [
                'medecin_id'       => '5',
                'service_id'       => 3,   // Échographie (hôpital: 30 000 → médecin: 40 000 gynéco)
                'prix_service'     => 40000,
                'majoration_ferie' => 20,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'Échographie obstétricale',
            ],
            [
                'medecin_id'       => '5',
                'service_id'       => 5,   // Consultation Spécialisée
                'prix_service'     => 28000,
                'majoration_ferie' => 25,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],

            // Dr. Babacar Seck (user_id=6) — Cardiologie
            [
                'medecin_id'       => '6',
                'service_id'       => 1,   // Consultation
                'prix_service'     => 22000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],
            [
                'medecin_id'       => '6',
                'service_id'       => 9,   // ECG (spécialité cardiologie)
                'prix_service'     => 18000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'ECG interprété par cardiologue',
            ],
            [
                'medecin_id'       => '6',
                'service_id'       => 5,   // Consultation Spécialisée
                'prix_service'     => 32000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],
            [
                'medecin_id'       => '6',
                'service_id'       => 10,  // Consultation Urgence
                'prix_service'     => null, // Fallback hôpital mais avec sa propre majoration
                'majoration_ferie' => 5000,
                'type_majoration'  => 'montant_fixe',
                'actif'            => true,
                'note'             => 'Urgence cardiologique — supplément fixe nuit/férié',
            ],
        ];

        foreach ($tarifs as $t) {
            // Vérifier que le service existe
            $svcExists = DB::table('gen_mst_service')
                ->where('id_service', $t['service_id'])
                ->exists();
            if (!$svcExists) continue;

            DB::table('gen_mst_medcin_tarif')->updateOrInsert(
                [
                    'medecin_id' => $t['medecin_id'],
                    'service_id' => $t['service_id'],
                ],
                array_merge($t, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
            );
        }

        $this->command->info('  → ' . DB::table('gen_mst_medcin_tarif')->count() . ' tarifs médecins insérés');
    }
}
