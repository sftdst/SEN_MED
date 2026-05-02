<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\PersonnelController;

echo "Simulating API request...\n";

// Create a mock request
$request = Request::create('/api/v1/personnels', 'GET', [
    'page' => 1,
    'per_page' => 5
]);

// Handle the request
$response = $app->handle($request);

echo "Status: " . $response->getStatusCode() . "\n";
$content = $response->getContent();
$data = json_decode($content, true);

if (isset($data['success']) && $data['success']) {
    echo "Response OK\n";
    $items = $data['data']['data'] ?? [];
    echo "Number of items: " . count($items) . "\n";
    if (count($items) > 0) {
        $first = $items[0];
        echo "First item fields: " . implode(', ', array_keys($first)) . "\n";
        echo "photo_url exists: " . (isset($first['photo_url']) ? 'YES' : 'NO') . "\n";
        echo "photo value: " . ($first['photo'] ?? 'null') . "\n";
        echo "photo_url value: " . ($first['photo_url'] ?? 'null') . "\n";
    }
} else {
    echo "Response error\n";
    echo substr($content, 0, 500);
}
