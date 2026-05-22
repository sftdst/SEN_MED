<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MatMedSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Catalogue d'équipements ─────────────────────────────────────────
        $equipements = [
            [
                'nom'             => 'Fauteuil roulant standard',
                'categorie'       => 'Mobilité',
                'description'     => 'Fauteuil roulant manuel pliable, idéal pour déplacements intérieurs et extérieurs.',
                'modele'          => 'FR-200',
                'reference'       => 'MAT-MOB-001',
                'nom_fournisseur' => 'MedEquip Sénégal',
                'prix_achat'      => 85000,
                'prix_location'   => 5000,
                'stock_disponible'=> 6,
                'stock_en_location'=> 2,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Béquilles réglables',
                'categorie'       => 'Mobilité',
                'description'     => 'Béquilles axillaires réglables en aluminium, légères et robustes.',
                'modele'          => 'BQ-AX',
                'reference'       => 'MAT-MOB-002',
                'nom_fournisseur' => 'MedEquip Sénégal',
                'prix_achat'      => 12000,
                'prix_location'   => 1500,
                'stock_disponible'=> 10,
                'stock_en_location'=> 3,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Déambulateur 4 roues',
                'categorie'       => 'Mobilité',
                'description'     => 'Déambulateur avec siège, panier de rangement et freins à main.',
                'modele'          => 'DM-4R',
                'reference'       => 'MAT-MOB-003',
                'nom_fournisseur' => 'PhysioMed Dakar',
                'prix_achat'      => 45000,
                'prix_location'   => 3000,
                'stock_disponible'=> 4,
                'stock_en_location'=> 1,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Concentrateur d\'oxygène 5L',
                'categorie'       => 'Respiratoire',
                'description'     => 'Concentrateur d\'oxygène portable 5 litres/min, usage domicile.',
                'modele'          => 'OXY-5L',
                'reference'       => 'MAT-RESP-001',
                'numero_serie'    => 'OX-2024-0045',
                'nom_fournisseur' => 'SanteEquip SARL',
                'prix_achat'      => 450000,
                'prix_location'   => 25000,
                'stock_disponible'=> 3,
                'stock_en_location'=> 2,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Nébuliseur électrique',
                'categorie'       => 'Respiratoire',
                'description'     => 'Nébuliseur à compression pour traitement des affections respiratoires.',
                'modele'          => 'NEB-300',
                'reference'       => 'MAT-RESP-002',
                'nom_fournisseur' => 'SanteEquip SARL',
                'prix_achat'      => 35000,
                'prix_location'   => 4000,
                'stock_disponible'=> 5,
                'stock_en_location'=> 1,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Lit médicalisé électrique',
                'categorie'       => 'Hospitalisation',
                'description'     => 'Lit à hauteur variable avec positions dossier et jambes réglables électriquement.',
                'modele'          => 'LIT-ELEC-3F',
                'reference'       => 'MAT-HOSP-001',
                'numero_serie'    => 'LT-2023-0012',
                'nom_fournisseur' => 'MedEquip Sénégal',
                'prix_achat'      => 850000,
                'prix_location'   => 45000,
                'stock_disponible'=> 2,
                'stock_en_location'=> 1,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Matelas anti-escarre',
                'categorie'       => 'Hospitalisation',
                'description'     => 'Matelas à pression alternante pour prévention des escarres.',
                'modele'          => 'MAT-AE-200',
                'reference'       => 'MAT-HOSP-002',
                'nom_fournisseur' => 'PhysioMed Dakar',
                'prix_achat'      => 120000,
                'prix_location'   => 8000,
                'stock_disponible'=> 4,
                'stock_en_location'=> 0,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Tensiomètre électronique bras',
                'categorie'       => 'Diagnostic',
                'description'     => 'Tensiomètre numérique automatique pour mesure tensionnelle au bras.',
                'modele'          => 'TEN-BRS-120',
                'reference'       => 'MAT-DIAG-001',
                'nom_fournisseur' => 'DiagnoMed',
                'prix_achat'      => 28000,
                'prix_location'   => 2000,
                'stock_disponible'=> 8,
                'stock_en_location'=> 2,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Glucomètre + bandelettes (30)',
                'categorie'       => 'Diagnostic',
                'description'     => 'Lecteur glycémique avec 30 bandelettes et lancettes incluses.',
                'modele'          => 'GLU-EASY',
                'reference'       => 'MAT-DIAG-002',
                'nom_fournisseur' => 'DiagnoMed',
                'prix_achat'      => 18000,
                'prix_location'   => 2500,
                'stock_disponible'=> 6,
                'stock_en_location'=> 1,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Potence à perfusion réglable',
                'categorie'       => 'Perfusion',
                'description'     => 'Potence IV à 4 crochets, hauteur réglable de 90 à 190 cm, sur roulettes.',
                'modele'          => 'POT-IV-4C',
                'reference'       => 'MAT-PERF-001',
                'nom_fournisseur' => 'MedEquip Sénégal',
                'prix_achat'      => 22000,
                'prix_location'   => 1500,
                'stock_disponible'=> 10,
                'stock_en_location'=> 4,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Chaise garde-robe',
                'categorie'       => 'Hygiène',
                'description'     => 'Chaise percée avec pot amovible pour patients à mobilité réduite.',
                'modele'          => 'CHG-STD',
                'reference'       => 'MAT-HYG-001',
                'nom_fournisseur' => 'PhysioMed Dakar',
                'prix_achat'      => 25000,
                'prix_location'   => 2000,
                'stock_disponible'=> 5,
                'stock_en_location'=> 0,
                'statut'          => 'actif',
            ],
            [
                'nom'             => 'Verticalisation — table de Fowler',
                'categorie'       => 'Rééducation',
                'description'     => 'Table de verticalisation progressive, réglable 0° à 90°.',
                'modele'          => 'FOWL-90',
                'reference'       => 'MAT-REHA-001',
                'numero_serie'    => 'FW-2025-0003',
                'nom_fournisseur' => 'SanteEquip SARL',
                'prix_achat'      => 680000,
                'prix_location'   => 35000,
                'stock_disponible'=> 1,
                'stock_en_location'=> 1,
                'statut'          => 'actif',
            ],
        ];

        $now = Carbon::now();
        $equipementIds = [];

        foreach ($equipements as $eq) {
            $id = DB::table('mm_mst_equipement')->insertGetId(array_merge($eq, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));
            $equipementIds[$eq['reference']] = $id;
        }

        $this->command->info('✓ ' . count($equipements) . ' équipements créés');

        // ── 2. Dossiers de location (exemples variés) ──────────────────────────
        $dossiers = [
            [
                'dossier' => [
                    'numero_dossier'        => 'LOC-2026-001',
                    'date_location'         => '2026-04-10',
                    'date_retour_prevue'    => '2026-05-10',
                    'date_retour_effective' => '2026-05-08',
                    'client_nom'            => 'DIALLO',
                    'client_prenom'         => 'Mamadou',
                    'client_telephone'      => '77 234 56 78',
                    'client_piece_identite' => 'CNI SN-2019-045678',
                    'montant_total'         => 100000,
                    'acompte'               => 50000,
                    'reliquat'              => 0,
                    'penalite'              => 0,
                    'statut'                => 'cloture',
                ],
                'lignes' => [
                    ['ref' => 'MAT-RESP-001', 'quantite' => 1, 'prix' => 25000],
                    ['ref' => 'MAT-PERF-001', 'quantite' => 2, 'prix' => 1500],
                ],
                'diagnostics' => [
                    ['type' => 'initial', 'etat' => 'bon',   'obs' => 'Équipement en parfait état. Complet avec accessoires.',       'sig' => 'Mamadou DIALLO',   'date' => '2026-04-10 09:30:00'],
                    ['type' => 'retour',  'etat' => 'bon',   'obs' => 'Retour en bon état. Nettoyé et désinfecté avant restitution.', 'sig' => 'Mamadou DIALLO',   'date' => '2026-05-08 14:00:00'],
                ],
            ],
            [
                'dossier' => [
                    'numero_dossier'        => 'LOC-2026-002',
                    'date_location'         => '2026-04-20',
                    'date_retour_prevue'    => '2026-05-20',
                    'date_retour_effective' => null,
                    'client_nom'            => 'FALL',
                    'client_prenom'         => 'Fatou',
                    'client_telephone'      => '70 987 65 43',
                    'client_piece_identite' => 'Passeport D-9823456',
                    'montant_total'         => 90000,
                    'acompte'               => 45000,
                    'reliquat'              => 45000,
                    'penalite'              => 0,
                    'statut'                => 'en_cours',
                ],
                'lignes' => [
                    ['ref' => 'MAT-MOB-001', 'quantite' => 1, 'prix' => 5000],
                    ['ref' => 'MAT-HOSP-001','quantite' => 1, 'prix' => 45000],
                ],
                'diagnostics' => [
                    ['type' => 'initial', 'etat' => 'bon', 'obs' => 'Équipements vérifiés et fonctionnels. Prise en main expliquée à la patiente.', 'sig' => 'Fatou FALL', 'date' => '2026-04-20 11:00:00'],
                ],
            ],
            [
                'dossier' => [
                    'numero_dossier'        => 'LOC-2026-003',
                    'date_location'         => '2026-05-01',
                    'date_retour_prevue'    => '2026-05-15',
                    'date_retour_effective' => null,
                    'client_nom'            => 'NDIAYE',
                    'client_prenom'         => 'Ibrahima',
                    'client_telephone'      => '76 111 22 33',
                    'client_piece_identite' => 'CNI SN-2021-112233',
                    'montant_total'         => 55000,
                    'acompte'               => 27500,
                    'reliquat'              => 27500,
                    'penalite'              => 5000,
                    'statut'                => 'en_retard',
                ],
                'lignes' => [
                    ['ref' => 'MAT-MOB-002', 'quantite' => 2, 'prix' => 1500],
                    ['ref' => 'MAT-DIAG-001','quantite' => 1, 'prix' => 2000],
                    ['ref' => 'MAT-DIAG-002','quantite' => 1, 'prix' => 2500],
                ],
                'diagnostics' => [
                    ['type' => 'initial', 'etat' => 'bon', 'obs' => 'Matériel complet. Patient informé des modalités de retour.', 'sig' => 'Ibrahima NDIAYE', 'date' => '2026-05-01 08:45:00'],
                ],
            ],
            [
                'dossier' => [
                    'numero_dossier'        => 'LOC-2026-004',
                    'date_location'         => '2026-05-10',
                    'date_retour_prevue'    => '2026-06-10',
                    'date_retour_effective' => null,
                    'client_nom'            => 'SARR',
                    'client_prenom'         => 'Aïssatou',
                    'client_telephone'      => '78 444 55 66',
                    'client_piece_identite' => 'CNI SN-2020-778899',
                    'montant_total'         => 35000,
                    'acompte'               => 0,
                    'reliquat'              => 35000,
                    'penalite'              => 0,
                    'statut'                => 'diagnostic_initial',
                ],
                'lignes' => [
                    ['ref' => 'MAT-REHA-001', 'quantite' => 1, 'prix' => 35000],
                ],
                'diagnostics' => [
                    ['type' => 'initial', 'etat' => 'bon', 'obs' => 'Table de Fowler en parfait état. Mécanisme vérifié. Patient accompagné par kinésithérapeute.', 'sig' => 'Aïssatou SARR', 'date' => '2026-05-10 10:15:00'],
                ],
            ],
            [
                'dossier' => [
                    'numero_dossier'        => 'LOC-2026-005',
                    'date_location'         => '2026-05-15',
                    'date_retour_prevue'    => '2026-05-22',
                    'date_retour_effective' => null,
                    'client_nom'            => 'MBAYE',
                    'client_prenom'         => 'Oumar',
                    'client_telephone'      => '77 666 77 88',
                    'client_piece_identite' => 'CNI SN-2022-334455',
                    'montant_total'         => 0,
                    'acompte'               => 0,
                    'reliquat'              => 0,
                    'penalite'              => 0,
                    'statut'                => 'en_attente_diagnostic',
                ],
                'lignes' => [
                    ['ref' => 'MAT-RESP-002', 'quantite' => 1, 'prix' => 4000],
                    ['ref' => 'MAT-HYG-001',  'quantite' => 1, 'prix' => 2000],
                ],
                'diagnostics' => [],
            ],
        ];

        foreach ($dossiers as $d) {
            $dossierId = DB::table('mm_mst_dossier_location')->insertGetId(array_merge($d['dossier'], [
                'created_at' => $now,
                'updated_at' => $now,
            ]));

            // Lignes
            foreach ($d['lignes'] as $l) {
                $eqId = $equipementIds[$l['ref']] ?? null;
                if (!$eqId) continue;
                DB::table('mm_mst_location_ligne')->insert([
                    'dossier_id'              => $dossierId,
                    'equipement_id'           => $eqId,
                    'quantite'                => $l['quantite'],
                    'prix_unitaire_location'  => $l['prix'],
                    'montant_ligne'           => $l['prix'] * $l['quantite'],
                    'created_at'              => $now,
                    'updated_at'              => $now,
                ]);
            }

            // Diagnostics
            foreach ($d['diagnostics'] as $diag) {
                DB::table('mm_mst_diagnostic')->insert([
                    'dossier_id'       => $dossierId,
                    'type_diagnostic'  => $diag['type'],
                    'etat_general'     => $diag['etat'],
                    'observations'     => $diag['obs'],
                    'signataire'       => $diag['sig'],
                    'date_diagnostic'  => $diag['date'],
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);
            }
        }

        $this->command->info('✓ ' . count($dossiers) . ' dossiers de location créés');
    }
}
