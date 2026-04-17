<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FicheAtt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FicheAttController extends Controller
{
    private const ALLOWED_MIMES = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    private const MAX_SIZE_MB = 20;

    /**
     * Liste des fichiers d'un patient (optionnel : filtre par visite).
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|string|exists:gen_mst_patient,patient_id',
            'adt_id'     => 'nullable|integer',
            'categorie'  => 'nullable|string',
        ]);

        $query = FicheAtt::where('patient_id', $request->patient_id)
            ->orderByDesc('created_at');

        if ($request->filled('adt_id')) {
            $query->where('adt_id', $request->adt_id);
        }
        if ($request->filled('categorie')) {
            $query->where('categorie', $request->categorie);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get(),
        ]);
    }

    /**
     * Upload d'un fichier ou d'une capture webcam (base64).
     */
    public function store(Request $request): JsonResponse
    {
        // Cas 1 : fichier classique via multipart
        if ($request->hasFile('fichier')) {
            $request->validate([
                'patient_id'  => 'required|string|exists:gen_mst_patient,patient_id',
                'adt_id'      => 'nullable|integer',
                'categorie'   => 'nullable|string|in:EXAMEN,RADIO,SCANNER,ECHO,ANALYSE,ORDONNANCE,AUTRE',
                'description' => 'nullable|string|max:500',
                'fichier'     => 'required|file|max:' . (self::MAX_SIZE_MB * 1024),
            ]);

            $file    = $request->file('fichier');
            $mime    = $file->getMimeType();

            if (!in_array($mime, self::ALLOWED_MIMES)) {
                return response()->json([
                    'success' => false,
                    'message' => "Type de fichier non autorisé ({$mime}).",
                ], 422);
            }

            $dir     = 'fiches_att/' . $request->patient_id;
            $slug    = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
            $ext     = strtolower($file->getClientOriginalExtension()) ?: 'bin';
            $stored  = Storage::disk('local')->putFileAs($dir, $file, Str::uuid() . '.' . $ext);

            $fiche = FicheAtt::create([
                'patient_id'      => $request->patient_id,
                'adt_id'          => $request->adt_id,
                'nom_fichier'     => $file->getClientOriginalName(),
                'chemin'          => $stored,
                'type_mime'       => $mime,
                'extension'       => $ext,
                'taille'          => $file->getSize(),
                'categorie'       => $request->input('categorie', 'EXAMEN'),
                'description'     => $request->description,
                'source'          => 'UPLOAD',
                'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fichier uploadé avec succès.',
                'data'    => $fiche,
            ], 201);
        }

        // Cas 2 : capture webcam (image base64)
        if ($request->filled('image_base64')) {
            $request->validate([
                'patient_id'   => 'required|string|exists:gen_mst_patient,patient_id',
                'adt_id'       => 'nullable|integer',
                'categorie'    => 'nullable|string|in:EXAMEN,RADIO,SCANNER,ECHO,ANALYSE,ORDONNANCE,AUTRE',
                'description'  => 'nullable|string|max:500',
                'image_base64' => 'required|string',
                'nom_fichier'  => 'nullable|string|max:255',
            ]);

            $data   = $request->image_base64;
            // Supprimer le préfixe data:image/jpeg;base64, si présent
            if (str_contains($data, ',')) {
                [, $data] = explode(',', $data, 2);
            }
            $decoded = base64_decode($data);
            if (!$decoded) {
                return response()->json(['success' => false, 'message' => 'Image invalide.'], 422);
            }

            $dir   = 'fiches_att/' . $request->patient_id;
            $uuid  = Str::uuid();
            $path  = $dir . '/' . $uuid . '.jpg';
            Storage::disk('local')->put($path, $decoded);

            $nom = $request->input('nom_fichier') ?: 'capture_' . now()->format('YmdHis') . '.jpg';

            $fiche = FicheAtt::create([
                'patient_id'      => $request->patient_id,
                'adt_id'          => $request->adt_id,
                'nom_fichier'     => $nom,
                'chemin'          => $path,
                'type_mime'       => 'image/jpeg',
                'extension'       => 'jpg',
                'taille'          => strlen($decoded),
                'categorie'       => $request->input('categorie', 'EXAMEN'),
                'description'     => $request->description,
                'source'          => 'WEBCAM',
                'created_user_id' => auth()?->user()?->id ?? 'SYSTEM',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Capture enregistrée avec succès.',
                'data'    => $fiche,
            ], 201);
        }

        return response()->json(['success' => false, 'message' => 'Aucun fichier fourni.'], 422);
    }

    /**
     * Servir (télécharger / afficher) un fichier.
     */
    public function serve(FicheAtt $fiche): Response
    {
        $path = $fiche->chemin;

        if (!Storage::disk('local')->exists($path)) {
            abort(404, 'Fichier introuvable.');
        }

        $content = Storage::disk('local')->get($path);
        $mime    = $fiche->type_mime ?: 'application/octet-stream';

        // Images et PDF : affichage inline
        $inline = str_starts_with($mime, 'image/') || $mime === 'application/pdf';

        return response($content, 200)
            ->header('Content-Type', $mime)
            ->header('Content-Disposition', ($inline ? 'inline' : 'attachment') . '; filename="' . $fiche->nom_fichier . '"')
            ->header('Content-Length', $fiche->taille);
    }

    /**
     * Supprimer un fichier.
     */
    public function destroy(FicheAtt $fiche): JsonResponse
    {
        Storage::disk('local')->delete($fiche->chemin);
        $fiche->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fichier supprimé.',
        ]);
    }
}
