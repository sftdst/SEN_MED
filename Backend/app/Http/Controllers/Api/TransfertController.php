<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfert;
use App\Models\Hospitalisation;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransfertController extends Controller
{
    public function index(Request $request)
    {
        $query = Transfert::with([
            'patient',
            'ancienMedecin', 'nouveauMedecin',
            'ancienService',  'nouveauService',
            'ancienneChambre', 'nouvelleChambre',
        ]);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->whereHas('patient', fn($q) =>
                $q->where('patient_name', 'ilike', "%$s%")
                  ->orWhere('patient_id', 'ilike', "%$s%")
            );
        }

        if ($request->filled('type_transfert')) {
            $query->where('type_transfert', $request->type_transfert);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $query->orderByDesc('date_transfert');

        $data = $query->paginate($request->get('per_page', 20));

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'             => 'required|string|exists:gen_mst_patient,patient_id',
            'type_transfert'         => 'required|in:INTERNE,EXTERNE',
            'date_transfert'         => 'required|date',
            'motif'                  => 'required|string|min:5',

            // Interne
            'ancien_medecin_id'      => 'nullable|integer|exists:hr_mst_user,id',
            'nouveau_medecin_id'     => 'nullable|integer|exists:hr_mst_user,id',
            'ancien_service_id'      => 'nullable|integer|exists:gen_mst_service,id_service',
            'nouveau_service_id'     => 'nullable|integer|exists:gen_mst_service,id_service',
            'ancienne_chambre_id'    => 'nullable|integer|exists:hosp_chambres,id_chambre',
            'nouvelle_chambre_id'    => 'nullable|integer|exists:hosp_chambres,id_chambre',

            // Externe
            'structure_destination'  => 'nullable|string|max:150',
            'medecin_destination'    => 'nullable|string|max:150',
            'commentaire'            => 'nullable|string',
        ]);

        // Règles métier
        if ($validated['type_transfert'] === 'INTERNE') {
            $hasChange = !empty($validated['nouveau_medecin_id'])
                      || !empty($validated['nouveau_service_id'])
                      || !empty($validated['nouvelle_chambre_id']);
            if (!$hasChange) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un transfert interne doit inclure au moins un changement (médecin, service ou chambre).',
                ], 422);
            }
        }

        if ($validated['type_transfert'] === 'EXTERNE') {
            if (empty($validated['structure_destination'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'La structure de destination est obligatoire pour un transfert externe.',
                ], 422);
            }
        }

        // Vérifier que le patient n'est pas déjà sorti
        $patient = Patient::where('patient_id', $validated['patient_id'])->firstOrFail();
        if (isset($patient->status_id) && $patient->status_id === 'sorti') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de transférer un patient déjà sorti.',
            ], 422);
        }

        try {
            DB::beginTransaction();

            $transfert = Transfert::create(array_merge($validated, [
                'statut'          => 'EN_COURS',
                'created_user_id' => 'SYSTEM',
            ]));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfert enregistré avec succès.',
                'data'    => $transfert->load([
                    'patient',
                    'ancienMedecin', 'nouveauMedecin',
                    'ancienService',  'nouveauService',
                    'ancienneChambre', 'nouvelleChambre',
                ]),
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(Transfert $transfert)
    {
        return response()->json([
            'success' => true,
            'data'    => $transfert->load([
                'patient',
                'ancienMedecin', 'nouveauMedecin',
                'ancienService',  'nouveauService',
                'ancienneChambre', 'nouvelleChambre',
            ]),
        ]);
    }

    public function valider(Transfert $transfert)
    {
        if ($transfert->statut !== 'EN_COURS') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les transferts EN_COURS peuvent être validés.',
            ], 422);
        }

        try {
            DB::beginTransaction();

            if ($transfert->type_transfert === 'EXTERNE') {
                // Clôturer l'hospitalisation active si elle existe
                Hospitalisation::where('patient_id', $transfert->patient_id)
                    ->where('statut', 'En cours')
                    ->update([
                        'statut'             => 'Terminée',
                        'date_sortie_reelle' => now()->toDateString(),
                    ]);
            }

            $transfert->update(['statut' => 'VALIDE']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfert validé avec succès.',
                'data'    => $transfert->fresh()->load([
                    'patient',
                    'ancienMedecin', 'nouveauMedecin',
                    'ancienService',  'nouveauService',
                    'ancienneChambre', 'nouvelleChambre',
                ]),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function annuler(Transfert $transfert)
    {
        if ($transfert->statut === 'VALIDE') {
            return response()->json([
                'success' => false,
                'message' => 'Un transfert déjà validé ne peut pas être annulé.',
            ], 422);
        }

        $transfert->update(['statut' => 'ANNULE']);

        return response()->json([
            'success' => true,
            'message' => 'Transfert annulé.',
            'data'    => $transfert->fresh(),
        ]);
    }

    public function stats()
    {
        $total    = Transfert::count();
        $enCours  = Transfert::where('statut', 'EN_COURS')->count();
        $valides  = Transfert::where('statut', 'VALIDE')->count();
        $annules  = Transfert::where('statut', 'ANNULE')->count();
        $internes = Transfert::where('type_transfert', 'INTERNE')->count();
        $externes = Transfert::where('type_transfert', 'EXTERNE')->count();

        return response()->json([
            'success' => true,
            'data'    => compact('total', 'enCours', 'valides', 'annules', 'internes', 'externes'),
        ]);
    }
}
