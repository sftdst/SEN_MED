<?php
$url = 'http://127.0.0.1:8000/api/v1/personnels/1';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
$data = json_decode($response, true);
if (isset($data['success']) && $data['success']) {
    $item = $data['data'];
    echo "photo: " . ($item['photo'] ?? 'null') . "\n";
    echo "photo_url exists: " . (array_key_exists('photo_url', $item) ? 'YES' : 'NO') . "\n";
    echo "photo_url value: " . ($item['photo_url'] ?? 'null') . "\n";
} else {
    echo "Error: " . ($data['message'] ?? 'unknown') . "\n";
    echo substr($response, 0, 300);
}