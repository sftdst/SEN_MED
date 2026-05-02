<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Personnel;
use Illuminate\Support\Facades\Storage;

// Find personnel with small photo
$p = Personnel::first();
echo "Current photo: " . $p->photo . "\n";
echo "Current photo_url: " . $p->photo_url . "\n";

// Update to hero.png if exists
if (Storage::disk('public')->exists('personnel_photos/hero.png')) {
    $p->photo = 'personnel_photos/hero.png';
    $p->save();
    echo "Updated photo to hero.png\n";
    echo "New photo_url: " . $p->photo_url . "\n";
} else {
    echo "hero.png not found\n";
}