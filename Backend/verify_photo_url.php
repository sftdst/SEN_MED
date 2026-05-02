<?php
$url = 'http://127.0.0.1:8000/api/v1/personnels?page=1&per_page=1';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($httpCode == 200) {
    $data = json_decode($response, true);
    $first = $data['data']['data'][0] ?? null;
    if ($first) {
        echo "photo_url: " . ($first['photo_url'] ?? 'MISSING') . "\n";
        echo "photo: " . ($first['photo'] ?? 'null') . "\n";
    }
} else {
    echo "HTTP $httpCode\n";
}