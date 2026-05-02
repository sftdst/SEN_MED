<?php
$url = 'http://localhost:8000/storage/personnel_photos/test.png';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Content-Type: $contentType\n";
echo "First 200 bytes of content:\n";
echo substr($response, 0, 200);
echo "\n";

// Try to get headers only
$ch2 = curl_init($url);
curl_setopt($ch2, CURLOPT_NOBODY, true);
curl_setopt($ch2, CURLOPT_TIMEOUT, 5);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HEADER, true);
$headers = curl_exec($ch2);
curl_close($ch2);
echo "\nHeaders:\n$headers\n";