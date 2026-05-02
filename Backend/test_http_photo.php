<?php
// Test if photo URL is accessible via HTTP
$url = 'http://localhost:8000/storage/personnel_photos/test.png';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP Code: $httpCode\n";
if ($httpCode == 200) {
    echo "Photo is accessible at $url\n";
} else {
    echo "Photo NOT accessible. Check server and storage link.\n";
}