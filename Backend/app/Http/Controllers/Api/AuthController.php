<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Connexion utilisateur
     * POST /api/v1/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        // Vérifier que le rôle existe (optionnel mais recommandé)
        if (!$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte n\'a pas de profil attribué. Contactez l\'administrateur.',
            ], 403);
        }

        // Créer un token Sanctum
        $token = $user->createToken('senmed-token')->plainTextToken;

        // Charger le rôle avec permissions
        $user->load('role.permissions');

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Inscription utilisateur (réservé aux admins ou pour création via API)
     * POST /api/v1/register
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'nullable|exists:roles,id',
            'personnel_id' => 'nullable|exists:hr_mst_user,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'personnel_id' => $request->personnel_id,
        ]);

        // Charger les relations
        $user->load('role.permissions');

        $token = $user->createToken('senmed-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur créé avec succès',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Déconnexion
     * POST /api/v1/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie',
        ]);
    }

    /**
     * Informations de l'utilisateur connecté
     * GET /api/v1/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié',
            ], 401);
        }

        $user->load('role.permissions');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Rafraîchir le token
     * POST /api/v1/refresh
     */
    public function refresh(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        $newToken = $request->user()->createToken('senmed-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $newToken,
            ],
        ]);
    }
}
