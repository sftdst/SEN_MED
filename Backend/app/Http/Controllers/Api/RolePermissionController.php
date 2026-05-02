<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RolePermissionController extends Controller
{
    /**
     * Liste tous les rôles avec leurs permissions
     * GET /api/v1/roles
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $roles = Role::with('permissions')
                         ->orderBy('order')
                         ->orderBy('id')
                         ->get();

            return response()->json([
                'success' => true,
                'data' => $roles,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des rôles: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Affiche un rôle avec ses permissions
     * GET /api/v1/roles/{id}
     */
    public function show(Role $role): JsonResponse
    {
        try {
            $role->load('permissions');

            return response()->json([
                'success' => true,
                'data' => $role,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crée un nouveau rôle
     * POST /api/v1/roles
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'key' => 'required|string|max:50|unique:roles,key',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'is_system' => 'boolean',
            'order' => 'integer',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        DB::beginTransaction();
        try {
            $role = Role::create([
                'name' => $validated['name'],
                'key' => $validated['key'],
                'icon' => $validated['icon'] ?? null,
                'color' => $validated['color'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_system' => $validated['is_system'] ?? false,
                'order' => $validated['order'] ?? 0,
            ]);

            if (!empty($validated['permission_ids'])) {
                $role->permissions()->sync($validated['permission_ids']);
            }

            DB::commit();

            $role->load('permissions');

            return response()->json([
                'success' => true,
                'message' => 'Rôle créé avec succès',
                'data' => $role,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du rôle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Met à jour un rôle
     * PUT/PATCH /api/v1/roles/{id}
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', Rule::unique('roles')->ignore($role->id)],
            'key' => ['sometimes', 'string', 'max:50', Rule::unique('roles')->ignore($role->id)],
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'is_system' => 'boolean',
            'order' => 'integer',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        DB::beginTransaction();
        try {
            $role->update([
                'name' => $validated['name'] ?? $role->name,
                'key' => $validated['key'] ?? $role->key,
                'icon' => array_key_exists('icon', $validated) ? $validated['icon'] : $role->icon,
                'color' => array_key_exists('color', $validated) ? $validated['color'] : $role->color,
                'description' => array_key_exists('description', $validated) ? $validated['description'] : $role->description,
                'is_system' => array_key_exists('is_system', $validated) ? $validated['is_system'] : $role->is_system,
                'order' => array_key_exists('order', $validated) ? $validated['order'] : $role->order,
            ]);

            if (isset($validated['permission_ids'])) {
                $role->permissions()->sync($validated['permission_ids']);
            }

            DB::commit();

            $role->load('permissions');

            return response()->json([
                'success' => true,
                'message' => 'Rôle mis à jour avec succès',
                'data' => $role,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du rôle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprime un rôle
     * DELETE /api/v1/roles/{id}
     */
    public function destroy(Role $role): JsonResponse
    {
        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Les rôles système ne peuvent pas être supprimés',
            ], 403);
        }

        try {
            $role->permissions()->detach();
            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rôle supprimé avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du rôle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Synchronise les permissions d'un rôle
     * POST /api/v1/roles/{id}/permissions
     */
    public function syncPermissions(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        try {
            $role->permissions()->sync($validated['permission_ids']);
            $role->load('permissions');

            return response()->json([
                'success' => true,
                'message' => 'Permissions mises à jour avec succès',
                'data' => $role,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Liste toutes les permissions (modules) groupées par groupe
     * GET /api/v1/permissions
     */
    public function permissionIndex(): JsonResponse
    {
        try {
            $permissions = Permission::orderBy('group_label')
                                     ->orderBy('order')
                                     ->get();

            // Grouper manuellement pour éviter les problèmes de collection groupBy
            $grouped = [];
            foreach ($permissions as $permission) {
                $group = $permission->group_label;
                if (!isset($grouped[$group])) {
                    $grouped[$group] = [];
                }
                $grouped[$group][] = [
                    'id' => $permission->id,
                    'key' => $permission->key,
                    'label' => $permission->label,
                    'group_label' => $permission->group_label,
                    'icon' => $permission->icon,
                    'description' => $permission->description,
                    'order' => $permission->order,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $grouped,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des permissions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crée ou met à jour une permission (module)
     * POST /api/v1/permissions
     * PUT /api/v1/permissions/{id}
     */
    public function permissionStore(Request $request, $id = null): JsonResponse
    {
        if ($id) {
            $permission = Permission::findOrFail($id);
            $rules = [
                'key' => ['required', 'string', 'max:50', Rule::unique('permissions')->ignore($permission->id)],
                'label' => 'required|string|max:100',
                'group_label' => 'required|string|max:50',
                'icon' => 'nullable|string|max:50',
                'description' => 'nullable|string',
                'order' => 'integer',
            ];
        } else {
            $rules = [
                'key' => 'required|string|max:50|unique:permissions,key',
                'label' => 'required|string|max:100',
                'group_label' => 'required|string|max:50',
                'icon' => 'nullable|string|max:50',
                'description' => 'nullable|string',
                'order' => 'integer',
            ];
        }

        $validated = $request->validate($rules);

        try {
            $permission = $id ? Permission::findOrFail($id) : new Permission();
            $permission->fill($validated);
            $permission->save();

            return response()->json([
                'success' => true,
                'message' => $id ? 'Permission mise à jour' : 'Permission créée',
                'data' => $permission,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprime une permission
     * DELETE /api/v1/permissions/{id}
     */
    public function permissionDestroy($id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        try {
            $permission->delete();

            return response()->json([
                'success' => true,
                'message' => 'Permission supprimée',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage(),
            ], 500);
        }
    }
}
