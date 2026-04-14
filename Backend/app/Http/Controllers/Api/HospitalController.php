<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HospitalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Hospital::with('departements');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('hospital_name', 'like', "%{$s}%")
                  ->orWhere('short_name', 'like', "%{$s}%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($request->get('per_page', 15)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'Hospital_id'    => 'nullable|numeric|unique:gen_mst_hospital,Hospital_id',
            'hospital_name'  => 'required|string|max:50',
            'short_name'     => 'nullable|string|max:50',
            'adress'         => 'nullable|string|max:50',
            'postal_code'    => 'nullable|string|max:50',
            'zip_code'       => 'nullable|string|max:50',
            'fax'            => 'nullable|string|max:50',
            'mobile_number'  => 'nullable|string|max:50',
            'contact_number' => 'nullable|string|max:50',
            'email_address'  => 'nullable|email|max:50',
            'website'        => 'nullable|string|max:50',
            'status_id'      => 'nullable|integer',
            'type_cabinet'   => 'nullable|string|max:50',
        ]);

        $hospital = Hospital::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Hôpital créé avec succès.',
            'data'    => $hospital,
        ], 201);
    }

    public function show(Hospital $hospital): JsonResponse
    {
        $hospital->load('departements.typeServices.services');

        return response()->json([
            'success' => true,
            'data'    => $hospital,
        ]);
    }

    public function update(Request $request, Hospital $hospital): JsonResponse
    {
        $validated = $request->validate([
            'Hospital_id'    => 'nullable|numeric|unique:gen_mst_hospital,Hospital_id,' . $hospital->id_Rep . ',id_Rep',
            'hospital_name'  => 'sometimes|required|string|max:50',
            'short_name'     => 'nullable|string|max:50',
            'adress'         => 'nullable|string|max:50',
            'postal_code'    => 'nullable|string|max:50',
            'zip_code'       => 'nullable|string|max:50',
            'fax'            => 'nullable|string|max:50',
            'mobile_number'  => 'nullable|string|max:50',
            'contact_number' => 'nullable|string|max:50',
            'email_address'  => 'nullable|email|max:50',
            'website'        => 'nullable|string|max:50',
            'status_id'      => 'nullable|integer',
            'type_cabinet'   => 'nullable|string|max:50',
        ]);

        $hospital->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Hôpital mis à jour avec succès.',
            'data'    => $hospital,
        ]);
    }

    public function destroy(Hospital $hospital): JsonResponse
    {
        $hospital->delete();

        return response()->json([
            'success' => true,
            'message' => 'Hôpital supprimé avec succès.',
        ]);
    }
}
