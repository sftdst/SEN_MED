<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Personnel;

echo "Testing photo URL generation...\n";

// Find first personnel with a photo
$p = Personnel::where('photo', '!=', '')->first();

if (!$p) {
    echo "No personnel with photo found.\n";
    // List all personnel photos
    $all = Personnel::all();
    echo "Total personnel: " . $all->count() . "\n";
    foreach ($all as $person) {
        echo "ID: {$person->id}, photo: " . ($person->photo ?? 'null') . "\n";
    }
} else {
    echo "Personnel ID: {$p->id}\n";
    echo "Photo field: {$p->photo}\n";
    echo "Photo URL: {$p->photo_url}\n";
    echo "Storage exists: " . (Storage::disk('public')->exists($p->photo) ? 'YES' : 'NO') . "\n";
}
