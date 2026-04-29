<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GeneratedCertificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeneratedCertificateController extends Controller
{
    /**
     * GET /generated-certificates?adt_id=X
     * Retourne l'historique des certificats générés pour une visite.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['adt_id' => 'required|integer']);

        $items = GeneratedCertificate::where('adt_id', $request->adt_id)
            ->orderByDesc('generated_at')
            ->get();

        return response()->json($items);
    }

    /**
     * POST /generated-certificates
     * Enregistre un certificat généré.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'adt_id'        => 'required|integer',
            'template_id'   => 'required|integer',
            'template_name' => 'required|string|max:255',
            'generated_by'  => 'nullable|string|max:255',
        ]);

        $cert = GeneratedCertificate::create($data);

        return response()->json($cert, 201);
    }
}
