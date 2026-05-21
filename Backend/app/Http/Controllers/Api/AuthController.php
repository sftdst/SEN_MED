<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MailingConfig;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── Helpers ────────────────────────────────────────────────────────────────

    private function buildUserPayload(User $user): array
    {
        $user->load('role.permissions', 'personnel');
        return [
            'id'                  => $user->id,
            'name'                => $user->name,
            'email'               => $user->email,
            'photo'               => $user->photo,
            'is_active'           => $user->is_active,
            'must_change_password'=> $user->must_change_password,
            'role'                => $user->role,
            'personnel'           => $user->personnel,
        ];
    }

    private function configureDynamicMailer(): void
    {
        try {
            $cfg = MailingConfig::first();
            if (!$cfg) return;

            Config::set('mail.mailers.smtp.host',       $cfg->host);
            Config::set('mail.mailers.smtp.port',       $cfg->port);
            Config::set('mail.mailers.smtp.encryption', $cfg->encryption);
            Config::set('mail.mailers.smtp.username',   $cfg->username);
            Config::set('mail.mailers.smtp.password',   decrypt($cfg->password));
            Config::set('mail.from.address',            $cfg->from_email);
            Config::set('mail.from.name',               $cfg->from_name);
        } catch (\Throwable) {}
    }

    // ── Login ──────────────────────────────────────────────────────────────────

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        // Vérifier compte actif (false explicite seulement — null = actif par défaut)
        if ($user->is_active === false) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est désactivé. Contactez l\'administrateur.',
            ], 403);
        }

        // Vérifier rôle
        if (!$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte n\'a pas de profil attribué. Contactez l\'administrateur.',
            ], 403);
        }

        $token = $user->createToken('senmed-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'data'    => [
                'user'  => $this->buildUserPayload($user),
                'token' => $token,
            ],
        ]);
    }

    // ── Register ───────────────────────────────────────────────────────────────

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:8|confirmed',
            'role_id'      => 'nullable|exists:roles,id',
            'personnel_id' => 'nullable|exists:hr_mst_user,id',
        ]);

        $user = User::create([
            'name'         => $request->name,
            'email'        => $request->email,
            'password'     => Hash::make($request->password),
            'role_id'      => $request->role_id,
            'personnel_id' => $request->personnel_id,
        ]);

        $token = $user->createToken('senmed-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur créé avec succès',
            'data'    => ['user' => $this->buildUserPayload($user), 'token' => $token],
        ], 201);
    }

    // ── Logout ─────────────────────────────────────────────────────────────────

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Déconnexion réussie']);
    }

    // ── Me ─────────────────────────────────────────────────────────────────────

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        return response()->json([
            'success' => true,
            'data'    => ['user' => $this->buildUserPayload($user)],
        ]);
    }

    // ── Refresh ────────────────────────────────────────────────────────────────

    public function refresh(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();
        $newToken = $request->user()->createToken('senmed-token')->plainTextToken;
        return response()->json(['success' => true, 'data' => ['token' => $newToken]]);
    }

    // ── Mot de passe oublié ────────────────────────────────────────────────────

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        // Toujours répondre la même chose (sécurité : ne pas confirmer si l'email existe)
        $user = User::where('email', $request->email)->where('is_active', true)->first();

        if ($user) {
            $tempPassword = Str::random(4) . rand(10, 99) . Str::upper(Str::random(2));

            $user->update([
                'password'             => Hash::make($tempPassword),
                'must_change_password' => true,
            ]);

            $this->configureDynamicMailer();

            $appName = config('app.name', 'SenMed');
            $html = "
                <div style='font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:32px 24px;border-radius:12px'>
                    <div style='text-align:center;margin-bottom:28px'>
                        <div style='display:inline-block;background:#003268;width:56px;height:56px;border-radius:50%;line-height:56px;font-size:22px;color:#fff'>🔑</div>
                        <h2 style='color:#003268;margin:16px 0 4px;font-size:20px'>{$appName}</h2>
                        <p style='color:#64748b;font-size:13px;margin:0'>Réinitialisation de mot de passe</p>
                    </div>
                    <div style='background:#fff;border-radius:10px;padding:24px;border:1px solid #e2e8f0'>
                        <p style='color:#374151;font-size:14px;margin:0 0 16px'>Bonjour <strong>{$user->name}</strong>,</p>
                        <p style='color:#374151;font-size:14px;margin:0 0 20px'>
                            Voici votre mot de passe temporaire pour vous connecter :
                        </p>
                        <div style='background:#f1f5f9;border:2px dashed #003268;border-radius:8px;padding:16px;text-align:center;margin:0 0 20px'>
                            <span style='font-size:22px;font-weight:800;letter-spacing:4px;color:#003268;font-family:monospace'>{$tempPassword}</span>
                        </div>
                        <p style='color:#64748b;font-size:13px;margin:0 0 8px'>
                            ⚠️ Ce mot de passe est temporaire. Vous devrez le changer lors de votre prochaine connexion.
                        </p>
                        <p style='color:#9ca3af;font-size:12px;margin:0'>
                            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                        </p>
                    </div>
                    <p style='text-align:center;color:#9ca3af;font-size:11px;margin-top:20px'>© " . date('Y') . " {$appName}</p>
                </div>
            ";

            try {
                Mail::html($html, function ($msg) use ($user, $appName) {
                    $msg->to($user->email, $user->name)
                        ->subject("[$appName] Votre mot de passe temporaire");
                });
            } catch (\Throwable $e) {
                // Log silencieux — ne pas exposer l'erreur SMTP
                \Log::error('ForgotPassword mail error: ' . $e->getMessage());
            }
        }

        // Toujours retourner success=true pour ne pas confirmer l'existence du compte
        return response()->json([
            'success' => true,
            'message' => 'Si un compte existe avec cet email, un mot de passe temporaire a été envoyé.',
        ]);
    }

    // ── Changer son propre mot de passe ────────────────────────────────────────

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6',
        ]);

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Le mot de passe actuel est incorrect.',
            ], 422);
        }

        $user->update([
            'password'             => Hash::make($data['new_password']),
            'must_change_password' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès.',
        ]);
    }

    // ── Garder le mot de passe actuel (première connexion) ─────────────────────

    public function keepPassword(Request $request): JsonResponse
    {
        $request->user()->update(['must_change_password' => false]);
        return response()->json(['success' => true, 'message' => 'Mot de passe conservé.']);
    }
}
