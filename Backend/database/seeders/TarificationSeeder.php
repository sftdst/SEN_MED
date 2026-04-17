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
        // Les médecins sont déjà créés par PersonnelSeeder (USR001-USR012)
        $this->command->info('  → ' . DB::table('hr_mst_user')->where('staff_type', 'medecin')->count() . ' médecins au total');
    }

    // ────────────────────────────────────────────────────────────────────────────
    private function seedTarifsMedecins(): void
    {
        $now = now();

        // Utilise les user_id définis dans PersonnelSeeder
        // USR001 = Dr. Amadou Diallo, USR004 = Dr. Cheikh Bassirou
        // USR006 = Dr. Aïda Mbaye,    USR007 = Dr. Babacar Seck
        $tarifs = [
            // Dr. Amadou Diallo (USR001) — Médecine Interne
            [
                'medecin_id'       => 'USR001',
                'service_id'       => 1,
                'prix_service'     => 18000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'Tarif senior médecine interne',
            ],
            [
                'medecin_id'       => 'USR001',
                'service_id'       => 5,
                'prix_service'     => 30000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],
            [
                'medecin_id'       => 'USR001',
                'service_id'       => 9,
                'prix_service'     => 15000,
                'majoration_ferie' => 2000,
                'type_majoration'  => 'montant_fixe',
                'actif'            => true,
                'note'             => 'Majoration fixe weekend férié',
            ],

            // Dr. Cheikh Bassirou (USR004) — Chirurgie Générale
            [
                'medecin_id'       => 'USR004',
                'service_id'       => 1,
                'prix_service'     => null,
                'majoration_ferie' => 50,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'Majoration fériée chirurgien',
            ],
            [
                'medecin_id'       => 'USR004',
                'service_id'       => 6,
                'prix_service'     => 90000,
                'majoration_ferie' => 75,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'Tarif acte chirurgical Dr. Bassirou',
            ],
            [
                'medecin_id'       => 'USR004',
                'service_id'       => 5,
                'prix_service'     => 35000,
                'majoration_ferie' => 50,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],

            // Dr. Aïda Mbaye (USR006) — Gynécologie
            [
                'medecin_id'       => 'USR006',
                'service_id'       => 1,
                'prix_service'     => 20000,
                'majoration_ferie' => 25,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],
            [
                'medecin_id'       => 'USR006',
                'service_id'       => 3,
                'prix_service'     => 40000,
                'majoration_ferie' => 20,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'Échographie obstétricale',
            ],
            [
                'medecin_id'       => 'USR006',
                'service_id'       => 5,
                'prix_service'     => 28000,
                'majoration_ferie' => 25,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],

            // Dr. Babacar Seck (USR007) — Cardiologie
            [
                'medecin_id'       => 'USR007',
                'service_id'       => 1,
                'prix_service'     => 22000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],
            [
                'medecin_id'       => 'USR007',
                'service_id'       => 9,
                'prix_service'     => 18000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => 'ECG interprété par cardiologue',
            ],
            [
                'medecin_id'       => 'USR007',
                'service_id'       => 5,
                'prix_service'     => 32000,
                'majoration_ferie' => 30,
                'type_majoration'  => 'pourcentage',
                'actif'            => true,
                'note'             => null,
            ],
            [
                'medecin_id'       => 'USR007',
                'service_id'       => 10,
                'prix_service'     => null,
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
