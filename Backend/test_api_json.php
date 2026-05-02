<?php
$url = 'http://127.0.0.1:8000/api/v1/personnels?page=1&per_page=5';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    $data = json_decode($response, true);
    // Show only first item
    $first = $data['data']['data'][0] ?? null;
    if ($first) {
        echo "First item photo_url: " . ($first['photo_url'] ?? 'MISSING') . "\n";
        echo "First item photo: " . ($first['photo'] ?? 'null') . "\n";
        // Show raw JSON of first item
        echo "\nRaw first item JSON:\n";
        echo json_encode($first, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    } else {
        echo "No items.\n";
    }
} else {
    echo "HTTP $httpCode\n";
    echo substr($response, 0, 500);
}