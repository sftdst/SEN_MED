<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MailingConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

class MailingConfigController extends Controller
{
    /* GET /mailing-config ─────────────────────────────────────────────────── */
    public function show(): JsonResponse
    {
        $config = MailingConfig::first();

        if (!$config) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'host'       => $config->host,
                'port'       => $config->port,
                'encryption' => $config->encryption,
                'username'   => $config->username,
                'password'   => $config->password ? '••••••••' : '',
                'from_name'  => $config->from_name,
                'from_email' => $config->from_email,
                'configured' => !empty($config->host) && !empty($config->from_email),
            ],
        ]);
    }

    /* POST /mailing-config ────────────────────────────────────────────────── */
    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'host'       => 'required|string|max:255',
            'port'       => 'required|integer|in:25,465,587,2525',
            'encryption' => 'required|in:none,ssl,tls',
            'username'   => 'nullable|string|max:255',
            'password'   => 'nullable|string|max:255',
            'from_name'  => 'required|string|max:100',
            'from_email' => 'required|email|max:255',
        ]);

        $config = MailingConfig::first() ?? new MailingConfig();

        // Conserver l'ancien mot de passe si le champ est vide (masqué côté client)
        if (empty($data['password']) || $data['password'] === '••••••••') {
            unset($data['password']);
        }

        $config->fill($data)->save();

        return response()->json([
            'success' => true,
            'message' => 'Configuration mailing enregistrée.',
        ]);
    }

    /* POST /mailing-config/test ───────────────────────────────────────────── */
    public function test(Request $request): JsonResponse
    {
        $request->validate([
            'to' => 'required|email',
        ]);

        $config = MailingConfig::first();

        if (!$config || empty($config->host)) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune configuration SMTP enregistrée.',
            ], 422);
        }

        // Appliquer dynamiquement la config au mailer
        Config::set('mail.mailers.smtp', [
            'transport'  => 'smtp',
            'host'       => $config->host,
            'port'       => $config->port,
            'encryption' => $config->encryption === 'none' ? null : $config->encryption,
            'username'   => $config->username,
            'password'   => $config->password,
        ]);
        Config::set('mail.from.address', $config->from_email);
        Config::set('mail.from.name',    $config->from_name);

        try {
            Mail::raw(
                "Ceci est un email de test envoyé depuis la plateforme SenMed.\n\nConfiguration SMTP vérifiée avec succès.",
                function ($msg) use ($request, $config) {
                    $msg->to($request->to)
                        ->subject('✅ Test SMTP — SenMed')
                        ->from($config->from_email, $config->from_name);
                }
            );

            return response()->json([
                'success' => true,
                'message' => "Email de test envoyé à {$request->to}",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Échec : ' . $e->getMessage(),
            ], 422);
        }
    }
}
