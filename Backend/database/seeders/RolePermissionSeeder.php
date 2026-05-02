<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Modules (permissions) de l'application regroupés par groupe
     */
    private array $modules = [
        'ACCUEIL' => [
            ['key' => 'dashboard',        'label' => 'Tableau de bord'],
            ['key' => 'patients',         'label' => 'Patients'],
            ['key' => 'visites',          'label' => 'Visites'],
            ['key' => 'salle-attente',    'label' => "Salle d'attente"],
            ['key' => 'hospitalisation',  'label' => 'Hospitalisation'],
            ['key' => 'transferts',       'label' => 'Transferts'],
        ],
        'ESPACE MÉDECIN' => [
            ['key' => 'espace-medecin', 'label' => 'Tableau de bord'],
        ],
        'GESTION RDV' => [
            ['key' => 'rendezvous', 'label' => 'Gestion des RDV'],
        ],
        'SOINS INFIRMIERS' => [
            ['key' => 'dossier-soins', 'label' => 'Dossier de Soins Infirmiers'],
        ],
        'GESTION PHARMACEUTIQUE' => [
            ['key' => 'pharmacie', 'label' => 'Pharmacie'],
        ],
        'COMPTABILITÉ' => [
            ['key' => 'comptabilite', 'label' => 'Comptabilité'],
            ['key' => 'tarification',  'label' => 'Tarification'],
        ],
        'RESSOURCES HUMAINES' => [
            ['key' => 'personnels',       'label' => 'Gestion personnel'],
            ['key' => 'conges',           'label' => 'Gestion congés'],
            ['key' => 'absences-retards', 'label' => 'Absences & retards'],
            ['key' => 'contrats',         'label' => 'Gestion contrats'],
        ],
        'CONFIGURATION' => [
            ['key' => 'config-systeme',   'label' => 'Configuration système'],
            ['key' => 'config-sanitaire', 'label' => 'Config. sanitaire'],
            ['key' => 'formulaires',      'label' => 'Formulaires'],
            ['key' => 'profil-droits',    'label' => 'Profil et droits'],
        ],
        'LABORATOIRE' => [
            ['key' => 'laboratoire', 'label' => 'Laboratoire'],
        ],
        'ADMINISTRATION' => [
            ['key' => 'departements', 'label' => 'Départements'],
            ['key' => 'hopitaux',     'label' => 'Hôpitaux'],
            ['key' => 'partenaires',  'label' => 'Partenaires'],
        ],
    ];

    /**
     * Profils (rôles) avec leurs modules par défaut
     */
    private array $profiles = [
        'medecin' => [
            'name' => 'Médecin',
            'icon' => '👨‍⚕️',
            'color' => '#2196f3',
            'modules' => [
                'dashboard', 'patients', 'visites', 'salle-attente', 'hospitalisation',
                'espace-medecin', 'dossier-soins', 'config-systeme', 'config-sanitaire',
            ],
        ],
        'infirmier' => [
            'name' => 'Infirmier',
            'icon' => '🩺',
            'color' => '#4caf50',
            'modules' => [
                'dashboard', 'patients', 'visites', 'salle-attente',
                'dossier-soins', 'laboratoire', 'config-systeme',
            ],
        ],
        'comptable' => [
            'name' => 'Comptable',
            'icon' => '💰',
            'color' => '#ff9800',
            'modules' => [
                'dashboard', 'comptabilite', 'tarification', 'patients', 'config-systeme',
            ],
        ],
        'rh' => [
            'name' => 'Ressources Humaines',
            'icon' => '👥',
            'color' => '#f44336',
            'modules' => [
                'dashboard', 'personnels', 'conges', 'absences-retards', 'contrats',
                'departements', 'hopitaux', 'config-systeme',
            ],
        ],
        'secretaire' => [
            'name' => 'Secrétaire',
            'icon' => '📝',
            'color' => '#00bcd4',
            'modules' => [
                'dashboard', 'patients', 'visites', 'salle-attente', 'rendezvous',
                'hospitalisation', 'transferts', 'config-systeme',
            ],
        ],
        'administrateur' => [
            'name' => 'Administrateur',
            'icon' => '🔧',
            'color' => '#9c27b0',
            'modules' => [
                'dashboard', 'patients', 'visites', 'salle-attente', 'hospitalisation',
                'transferts', 'rendezvous', 'espace-medecin', 'dossier-soins', 'pharmacie',
                'comptabilite', 'tarification', 'personnels', 'conges', 'absences-retards',
                'contrats', 'config-systeme', 'config-sanitaire', 'formulaires', 'laboratoire',
                'departements', 'hopitaux', 'partenaires', 'profil-droits',
            ],
        ],
    ];

    public function run(): void
    {
        DB::transaction(function () {
            // 1. Créer toutes les permissions (modules)
            $order = 0;
            $permissionsMap = [];

            foreach ($this->modules as $groupLabel => $modules) {
                foreach ($modules as $module) {
                    $permission = Permission::firstOrCreate(
                        ['key' => $module['key']],
                        [
                            'label' => $module['label'],
                            'group_label' => $groupLabel,
                            'icon' => null,
                            'order' => $order++,
                        ]
                    );
                    $permissionsMap[$module['key']] = $permission;
                }
            }

            // 2. Créer les rôles et leurs permissions par défaut
            foreach ($this->profiles as $key => $profile) {
                $role = Role::firstOrCreate(
                    ['key' => $key],
                    [
                        'name' => $profile['name'],
                        'icon' => $profile['icon'],
                        'color' => $profile['color'],
                        'description' => 'Profil système ' . $profile['name'],
                        'is_system' => true,
                        'order' => array_search($key, array_keys($this->profiles)),
                    ]
                );

                // Récupérer les IDs des permissions
                $permissionIds = [];
                foreach ($profile['modules'] as $moduleKey) {
                    if (isset($permissionsMap[$moduleKey])) {
                        $permissionIds[] = $permissionsMap[$moduleKey]->id;
                    }
                }

                // Attacher les permissions
                $role->permissions()->sync($permissionIds);
            }
        });
    }
}
