<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocTemplate;
use App\Models\TemplateVariable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DocumentTemplateController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Templates (Modèles de documents)
    |--------------------------------------------------------------------------
    */

    /** Liste tous les templates */
    public function index(Request $request): JsonResponse
    {
        $query = DocTemplate::orderBy('description');

        if ($search = $request->query('search')) {
            $query->where('description', 'like', "%{$search}%");
        }

        return response()->json($query->get());
    }

    /** Créer un nouveau template */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'description' => 'required|string|max:255',
            'header'      => 'nullable|string|max:500',
            'content'     => 'nullable|string',
        ]);

        $template = DocTemplate::create($data);

        return response()->json($template, 201);
    }

    /** Détail d'un template */
    public function show(DocTemplate $template): JsonResponse
    {
        return response()->json($template);
    }

    /** Mettre à jour un template */
    public function update(Request $request, DocTemplate $template): JsonResponse
    {
        $data = $request->validate([
            'description' => 'sometimes|required|string|max:255',
            'header'      => 'nullable|string|max:500',
            'content'     => 'nullable|string',
        ]);

        $template->update($data);

        return response()->json($template);
    }

    /** Supprimer un template */
    public function destroy(DocTemplate $template): JsonResponse
    {
        $template->delete();
        return response()->json(null, 204);
    }

    /*
    |--------------------------------------------------------------------------
    | Variables
    |--------------------------------------------------------------------------
    */

    /** Liste toutes les variables (système + personnalisées) */
    public function variables(Request $request): JsonResponse
    {
        $variables = TemplateVariable::orderByRaw('is_system DESC, label ASC')->get();
        return response()->json($variables);
    }

    /** Ajouter une variable personnalisée */
    public function storeVariable(Request $request): JsonResponse
    {
        $data = $request->validate([
            'variable_name' => 'required|string|max:100|unique:template_variables,variable_name|regex:/^[a-z0-9_]+$/',
            'label'         => 'required|string|max:200',
        ]);

        $data['is_system'] = false;

        $variable = TemplateVariable::create($data);

        return response()->json($variable, 201);
    }

    /** Modifier le label d'une variable personnalisée */
    public function updateVariable(Request $request, TemplateVariable $variable): JsonResponse
    {
        if ($variable->is_system) {
            return response()->json(['message' => 'Les variables système ne peuvent pas être modifiées.'], 403);
        }

        $data = $request->validate([
            'label' => 'required|string|max:200',
        ]);

        $variable->update($data);

        return response()->json($variable);
    }

    /** Supprimer une variable personnalisée */
    public function destroyVariable(TemplateVariable $variable): JsonResponse
    {
        if ($variable->is_system) {
            return response()->json(['message' => 'Les variables système ne peuvent pas être supprimées.'], 403);
        }

        $variable->delete();
        return response()->json(null, 204);
    }
}
