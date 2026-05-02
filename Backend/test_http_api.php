<?php
// Test API response via HTTP
$url = 'http://127.0.0.1:8000/api/v1/personnels?page=1&per_page=5';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";

if ($httpCode == 200) {
    $data = json_decode($response, true);
    if (isset($data['success']) && $data['success']) {
        $items = $data['data']['data'] ?? [];
        echo "Items count: " . count($items) . "\n";
        if (count($items) > 0) {
            $first = $items[0];
            echo "photo: " . ($first['photo'] ?? 'null') . "\n";
            echo "photo_url: " . ($first['photo_url'] ?? 'null') . "\n";
        }
    } else {
        echo "API error: " . ($data['message'] ?? 'unknown') . "\n";
    }
} else {
    echo "HTTP error $httpCode\n";
    echo substr($response, 0, 500);
}
