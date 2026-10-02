<?php

/**
 * INSAAN HRIS - Shared Hosting Artisan Web Runner
 * Digunakan untuk mengeksekusi artisan command via browser di cPanel / Shared Hosting
 */

define('LARAVEL_START', microtime(true));

// Autoload & Bootstrap
if (! file_exists(__DIR__.'/../vendor/autoload.php')) {
    die('Error: vendor/autoload.php tidak ditemukan. Pastikan folder vendor sudah terupload.');
}

require __DIR__.'/../vendor/autoload.php';

if (! file_exists(__DIR__.'/../bootstrap/app.php')) {
    die('Error: bootstrap/app.php tidak ditemukan.');
}

/** @var \Illuminate\Foundation\Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$action = $_GET['action'] ?? 'run';
$output = '';
$statusCode = 0;
$executedCommand = '';

if ($action === 'migrate_fresh') {
    $executedCommand = 'php artisan migrate:fresh --seed --force';
    try {
        $statusCode = $kernel->call('migrate:fresh', [
            '--seed' => true,
            '--force' => true,
        ]);
        $output = $kernel->output();
    } catch (\Throwable $e) {
        $output = 'ERROR: '.$e->getMessage()."\n\n".$e->getTraceAsString();
        $statusCode = 1;
    }
} elseif ($action === 'storage_link') {
    $executedCommand = 'php artisan storage:link';
    try {
        $statusCode = $kernel->call('storage:link');
        $output = $kernel->output();
    } catch (\Throwable $e) {
        $output = 'ERROR: '.$e->getMessage()."\n\n".$e->getTraceAsString();
        $statusCode = 1;
    }
} elseif ($action === 'optimize_clear') {
    $executedCommand = 'php artisan optimize:clear';
    try {
        $statusCode = $kernel->call('optimize:clear');
        $output = $kernel->output();
    } catch (\Throwable $e) {
        $output = 'ERROR: '.$e->getMessage()."\n\n".$e->getTraceAsString();
        $statusCode = 1;
    }
} elseif ($action === 'seed_org') {
    $executedCommand = 'php artisan db:seed --class=OrgStructureSeeder --force';
    try {
        $statusCode = $kernel->call('db:seed', [
            '--class' => 'OrgStructureSeeder',
            '--force' => true,
        ]);
        $output = $kernel->output();
    } catch (\Throwable $e) {
        $output = 'ERROR: '.$e->getMessage()."\n\n".$e->getTraceAsString();
        $statusCode = 1;
    }
} elseif ($action === 'run') {
    // Default: langsung jalankan migrate:fresh --seed
    $executedCommand = 'php artisan migrate:fresh --seed --force';
    try {
        $statusCode = $kernel->call('migrate:fresh', [
            '--seed' => true,
            '--force' => true,
        ]);
        $output = $kernel->output();
    } catch (\Throwable $e) {
        $output = 'ERROR: '.$e->getMessage()."\n\n".$e->getTraceAsString();
        $statusCode = 1;
    }
}

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insaan APU - Artisan Runner Shared Hosting</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: #0b1c30; color: #f8fafd; padding: 24px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 900px; }
        .header { display: flex; align-items: center; justify-between; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; }
        .logo { font-size: 22px; font-weight: 800; color: #fff; }
        .logo span { color: #38bdf8; }
        .badge { background: #0284c7; color: white; font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 700; margin-left: 12px; }
        .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .btn { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 10px; cursor: pointer; border: none; transition: 0.2s; }
        .btn-primary { background: #0053d0; color: #fff; }
        .btn-primary:hover { background: #0043a8; }
        .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); }
        .btn-secondary:hover { background: #334155; color: #fff; }
        .btn-success { background: #059669; color: #fff; }
        .terminal { background: #030712; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 14px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .terminal-header { background: #111827; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dots { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-red { background: #ef4444; }
        .dot-yellow { background: #f59e0b; }
        .dot-green { background: #10b981; }
        .cmd-title { font-family: monospace; font-size: 12px; color: #94a3b8; }
        .terminal-body { padding: 20px; font-family: "Courier New", Courier, monospace; font-size: 13px; line-height: 1.6; color: #38bdf8; white-space: pre-wrap; word-break: break-all; max-height: 500px; overflow-y: auto; }
        .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #64748b; }
        .footer a { color: #38bdf8; text-decoration: none; font-weight: 700; margin-left: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <span class="logo">INSAAN APU<span>.</span></span>
                <span class="badge">Artisan Runner Shared Hosting</span>
            </div>
        </div>

        <div class="actions">
            <a href="?action=migrate_fresh" class="btn btn-primary">⚡ Jalankan migrate:fresh --seed</a>
            <a href="?action=storage_link" class="btn btn-secondary">🔗 Jalankan storage:link</a>
            <a href="?action=optimize_clear" class="btn btn-secondary">🧹 Clear Cache (optimize:clear)</a>
            <a href="?action=seed_org" class="btn btn-secondary">🏛️ Seed Organisasi Saja</a>
            <a href="/" class="btn btn-success">➔ Buka Aplikasi Web</a>
        </div>

        <div class="terminal">
            <div class="terminal-header">
                <div class="dots">
                    <span class="dot dot-red"></span>
                    <span class="dot dot-yellow"></span>
                    <span class="dot dot-green"></span>
                </div>
                <div class="cmd-title"><?= htmlspecialchars($executedCommand) ?></div>
                <div style="font-size: 11px; font-weight: 700; color: <?= $statusCode === 0 ? '#10b981' : '#ef4444' ?>;">
                    <?= $statusCode === 0 ? 'STATUS: SUCCESS (0)' : 'STATUS: FAILED ('.$statusCode.')' ?>
                </div>
            </div>
            <div class="terminal-body"><?= htmlspecialchars($output ?: "Command selesai dijalankan tanpa output tambahan.\n") ?></div>
        </div>

        <div class="footer">
            Perhatian: File ini hanya untuk setup shared hosting. Hapus atau batasi akses file ini di lingkungan production live.
            <a href="/">Kembali ke Login</a>
        </div>
    </div>
</body>
</html>
