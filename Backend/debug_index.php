<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Patient;

$patients = Patient::paginate(50);
foreach ($patients->items() as $p) {
    echo "ID: {$p->id_Rep}, photo_url: " . ($p->photo_url ?? 'null') . PHP_EOL;
}
