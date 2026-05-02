<?php
// Créer un PNG rouge 100x100
$im = imagecreatetruecolor(100, 100);
$red = imagecolorallocate($im, 255, 0, 0);
imagefill($im, 0, 0, $red);
ob_start();
imagepng($im);
$png = ob_get_clean();
file_put_contents(__DIR__.'/storage/app/public/personnel_photos/red100.png', $png);
echo "Image rouge 100x100 créée." . PHP_EOL;

// Assigner au personnel USR002 (id=2)
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use App\Models\Personnel;
$p = Personnel::where('user_id', 'USR002')->first();
if ($p) {
    $p->photo = 'personnel_photos/red100.png';
    $p->save();
    echo "Photo assignée à USR002. photo_url: " . $p->photo_url . PHP_EOL;
} else {
    echo "USR002 non trouvé." . PHP_EOL;
}