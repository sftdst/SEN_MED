<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Personnel;
use Illuminate\Http\JsonResponse;

header('Content-Type: application/json');

// Simuler la réponse de l'API
$personnels = Personnel::with('departement')->limit(3)->get();

$response = [
    'success' => true,
    'data' => $personnels,
    'meta' => [
        'labels' => Personnel::labels(),
    ],
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
