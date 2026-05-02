<?php
// Simple server starter for Windows
$cmd = 'php artisan serve --host=0.0.0.0 --port=8000';
$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];
$process = proc_open($cmd, $descriptors, $pipes, __DIR__);
if (is_resource($process)) {
    echo "Server started with PID: " . proc_get_status($process)['pid'] . "\n";
    // Read output
    stream_set_blocking($pipes[1], false);
    stream_set_blocking($pipes[2], false);
    $startTime = time();
    while (time() - $startTime < 5) {
        $output = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        if ($output) echo "OUT: $output";
        if ($error) echo "ERR: $error";
        sleep(1);
    }
    // Keep running
    fwrite($pipes[0], " ");
    proc_close($process);
}