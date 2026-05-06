<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppPreferenceController extends Controller
{
    private array $defaults = [
        'app_name'        => 'SenMed',
        'app_slogan'      => 'Soins Médicaux',
        'app_initial'     => 'SM',
        'primary_color'   => '#002f59',
        'accent_color'    => '#ff7631',
        'theme_mode'      => 'light',
        'density'         => 'normal',
        'sidebar_default' => 'expanded',
        'language'        => 'fr',
        'currency'        => 'FCFA',
        'date_format'     => 'DD/MM/YYYY',
        'default_page'    => '/',
    ];

    /* GET /app-preferences ───────────────────────────────────────────────── */
    public function show(): JsonResponse
    {
        $pref = AppPreference::first();
        return response()->json(['data' => $pref ?? $this->defaults]);
    }

    /* POST /app-preferences ──────────────────────────────────────────────── */
    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'app_name'        => 'required|string|max:100',
            'app_slogan'      => 'nullable|string|max:200',
            'app_initial'     => 'required|string|max:5',
            'primary_color'   => 'required|string|max:20',
            'accent_color'    => 'required|string|max:20',
            'theme_mode'      => 'required|in:light,dark',
            'density'         => 'required|in:compact,normal,comfortable',
            'sidebar_default' => 'required|in:expanded,collapsed',
            'language'        => 'required|in:fr,en',
            'currency'        => 'required|in:FCFA,EUR,USD',
            'date_format'     => 'required|in:DD/MM/YYYY,MM/DD/YYYY,YYYY-MM-DD',
            'default_page'    => 'required|string|max:100',
        ]);

        $pref = AppPreference::first() ?? new AppPreference();
        $pref->fill($data)->save();

        return response()->json([
            'success' => true,
            'message' => 'Préférences enregistrées.',
            'data'    => $pref,
        ]);
    }
}
