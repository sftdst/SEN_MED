<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $q = User::with('role', 'personnel')
            ->when($request->search, function ($query, $s) {
                $query->where(function ($q) use ($s) {
                    $q->where('name', 'like', "%$s%")
                      ->orWhere('email', 'like', "%$s%");
                });
            })
            ->when($request->role_id, fn($q, $r) => $q->where('role_id', $r))
            ->when($request->has('is_active'), fn($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)))
            ->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $q]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6',
            'role_id'      => 'nullable|exists:roles,id',
            'personnel_id' => 'nullable|exists:hr_mst_user,id',
            'photo'        => 'nullable|image|max:2048',
            'is_active'    => 'boolean',
        ]);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('users/photos', 'public');
        }

        $data['must_change_password'] = true;

        $user = User::create($data);

        return response()->json([
            'success' => true,
            'data'    => $user->load('role', 'personnel'),
            'message' => 'Utilisateur créé avec succès.',
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data'    => $user->load('role', 'personnel'),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'         => 'sometimes|required|string|max:100',
            'email'        => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password'     => 'nullable|string|min:6',
            'role_id'      => 'nullable|exists:roles,id',
            'personnel_id' => 'nullable|exists:hr_mst_user,id',
            'photo'        => 'nullable|image|max:2048',
            'is_active'    => 'boolean',
        ]);

        // Upload nouvelle photo
        if ($request->hasFile('photo')) {
            if ($user->photo) Storage::disk('public')->delete($user->photo);
            $data['photo'] = $request->file('photo')->store('users/photos', 'public');
        }

        // Ne hasher le mot de passe que s'il est fourni
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'data'    => $user->fresh()->load('role', 'personnel'),
            'message' => 'Utilisateur modifié avec succès.',
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $authUser = $request->user();
        if ($authUser && $user->id === $authUser->id) {
            return response()->json(['success' => false, 'message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }

        if ($user->photo) Storage::disk('public')->delete($user->photo);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['success' => true, 'message' => 'Utilisateur supprimé.']);
    }

    public function toggleActive(Request $request, User $user)
    {
        $authUser = $request->user();
        if ($authUser && $user->id === $authUser->id) {
            return response()->json(['success' => false, 'message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 403);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'data'    => $user->fresh()->load('role'),
            'message' => $user->is_active ? 'Compte activé.' : 'Compte désactivé.',
        ]);
    }

    public function resetPassword(Request $request, User $user)
    {
        $data = $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['success' => true, 'message' => 'Mot de passe réinitialisé.']);
    }

    public function deletePhoto(User $user)
    {
        if ($user->photo) {
            Storage::disk('public')->delete($user->photo);
            $user->update(['photo' => null]);
        }

        return response()->json(['success' => true, 'message' => 'Photo supprimée.']);
    }
}
