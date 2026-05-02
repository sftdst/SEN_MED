<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Personnel model loading...\n";
try {
    $p = new App\Models\Personnel();
    echo "SUCCESS: Personnel instantiated\n";
    echo "Appends: " . json_encode($p->getAppends()) . "\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " line " . $e->getLine() . "\n";
}