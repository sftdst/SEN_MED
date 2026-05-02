<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer les rôles
        $roles = Role::all();

        if ($roles->isEmpty()) {
            $this->command->info('Aucun rôle trouvé. Exécutez RolePermissionSeeder d\'abord.');
            return;
        }

        // Créer un utilisateur par rôle
        foreach ($roles as $role) {
            $email = $role->key . '@senmed.sn';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $role->name,
                    'password' => Hash::make('password'), // Mot de passe par défaut: password
                    'role_id' => $role->id,
                ]
            );

            $this->command->info("Utilisateur créé: {$user->email} (Rôle: {$role->name})");
        }

        // Créer un super admin (optionnel)
        $adminRole = Role::where('key', 'administrateur')->first();
        if ($adminRole) {
            User::firstOrCreate(
                ['email' => 'admin@senmed.sn'],
                [
                    'name' => 'Super Administrateur',
                    'password' => Hash::make('admin123'),
                    'role_id' => $adminRole->id,
                ]
            );
        }
    }
}
