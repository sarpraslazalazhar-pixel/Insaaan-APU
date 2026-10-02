<?php

/**
 * INSAAN HRIS - Shared Hosting Artisan Web Runner & Diagnostic Tool
 */

define('LARAVEL_START', microtime(true));

// 1. Auto-Detect Vendor and Bootstrap Paths (supports various cPanel directory structures)
$baseDir = null;
$possibleRoots = [
    __DIR__ . '/..',
    __DIR__,
    __DIR__ . '/../laravel',
    __DIR__ . '/../core',
    __DIR__ . '/../backend',
    dirname(__DIR__),
];

foreach ($possibleRoots as $dir) {
    if (file_exists($dir . '/vendor/autoload.php') && file_exists($dir . '/bootstrap/app.php')) {
        $baseDir = realpath($dir);
        break;
    }
}

$hasVendor = $baseDir !== null;
$phpVersion = PHP_VERSION;
$phpVersionOk = version_compare(PHP_VERSION, '8.2.0', '>=');
$envExists = $hasVendor && file_exists($baseDir . '/.env');
$storageWritable = $hasVendor && is_writable($baseDir . '/storage');
$cacheWritable = $hasVendor && is_writable($baseDir . '/bootstrap/cache');

$dbStatus = 'Belum Diuji';
$dbError = null;
$output = '';
$statusCode = 0;
$executedCommand = '';

$app = null;
$kernel = null;

if ($hasVendor) {
    require $baseDir . '/vendor/autoload.php';
    /** @var \Illuminate\Foundation\Application $app */
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

    // Test DB Connection
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbStatus = 'Tersambung (' . config('database.default') . ')';
    } catch (\Throwable $e) {
        $dbStatus = 'Gagal Tersambung';
        $dbError = $e->getMessage();
    }
}

// Action Dispatcher
$action = $_GET['action'] ?? null;

if ($action && $hasVendor && $kernel) {
    if ($action === 'migrate_fresh') {
        $executedCommand = 'php artisan migrate:fresh --seed --force';
        try {
            $statusCode = $kernel->call('migrate:fresh', ['--seed' => true, '--force' => true]);
            $output = $kernel->output();
        } catch (\Throwable $e) {
            $output = "ERROR: " . $e->getMessage() . "\n\n" . $e->getTraceAsString();
            $statusCode = 1;
        }
    } elseif ($action === 'storage_link') {
        $executedCommand = 'php artisan storage:link';
        try {
            $statusCode = $kernel->call('storage:link');
            $output = $kernel->output();
        } catch (\Throwable $e) {
            $output = "ERROR: " . $e->getMessage();
            $statusCode = 1;
        }
    } elseif ($action === 'optimize_clear') {
        $executedCommand = 'php artisan optimize:clear';
        try {
            $statusCode = $kernel->call('optimize:clear');
            $output = $kernel->output();
        } catch (\Throwable $e) {
            $output = "ERROR: " . $e->getMessage();
            $statusCode = 1;
        }
    } elseif ($action === 'key_generate') {
        $executedCommand = 'php artisan key:generate --force';
        try {
            $statusCode = $kernel->call('key:generate', ['--force' => true]);
            $output = $kernel->output();
        } catch (\Throwable $e) {
            $output = "ERROR: " . $e->getMessage();
            $statusCode = 1;
        }
    }
}

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insaan APU - Shared Hosting Diagnostic & Runner</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: #0b1c30; color: #f8fafd; padding: 24px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 960px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; }
        .logo { font-size: 22px; font-weight: 800; color: #fff; }
        .logo span { color: #38bdf8; }
        .badge { background: #0284c7; color: white; font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 700; }

        .grid-status { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .card { background: #111827; border: 1px solid rgba(255,255,255,0.1); padding: 16px; rounded: 14px; border-radius: 12px; }
        .card-label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
        .card-val { font-size: 14px; font-weight: 800; }
        .val-ok { color: #10b981; }
        .val-bad { color: #ef4444; }

        .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .btn { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; font-size: 13px; font-weight: 700; padding: 11px 18px; border-radius: 10px; cursor: pointer; border: none; transition: 0.2s; }
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
        .notice-box { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 16px; border-radius: 12px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; color: #fca5a5; }
        .notice-box strong { color: #fff; }
        .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #64748b; }
        .footer a { color: #38bdf8; text-decoration: none; font-weight: 700; margin-left: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <span class="logo">INSAAN APU<span>.</span></span>
                <span class="badge">Diagnosa Shared Hosting</span>
            </div>
            <a href="/" class="btn btn-success">➔ Buka Web Utama</a>
        </div>

        <!-- System Health Check Cards -->
        <div class="grid-status">
            <div class="card">
                <div class="card-label">PHP Version</div>
                <div class="card-val <?= $phpVersionOk ? 'val-ok' : 'val-bad' ?>">
                    PHP <?= $phpVersion ?> <?= $phpVersionOk ? '✓' : '(Minimal 8.2!)' ?>
                </div>
            </div>

            <div class="card">
                <div class="card-label">Folder Vendor</div>
                <div class="card-val <?= $hasVendor ? 'val-ok' : 'val-bad' ?>">
                    <?= $hasVendor ? 'Terpasang ✓' : 'Belum Terupload / Tidak Ditemukan ✕' ?>
                </div>
            </div>

            <div class="card">
                <div class="card-label">File .env</div>
                <div class="card-val <?= $envExists ? 'val-ok' : 'val-bad' ?>">
                    <?= $envExists ? 'Ada ✓' : 'Belum Ada / Tersembunyi ✕' ?>
                </div>
            </div>

            <div class="card">
                <div class="card-label">Koneksi Database</div>
                <div class="card-val <?= $dbStatus === 'Gagal Tersambung' ? 'val-bad' : 'val-ok' ?>">
                    <?= htmlspecialchars($dbStatus) ?>
                </div>
            </div>

            <div class="card">
                <div class="card-label">Izin Storage</div>
                <div class="card-val <?= $storageWritable ? 'val-ok' : 'val-bad' ?>">
                    <?= $storageWritable ? 'Writable (775/777) ✓' : 'Read-only (Perlu CHMOD 775) ✕' ?>
                </div>
            </div>
        </div>

        <?php if (! $hasVendor): ?>
            <div class="notice-box">
                <strong>Folder `vendor` tidak terdeteksi!</strong><br>
                Pastikan Anda mengunggah folder `vendor` dari lokal ke server hosting Anda di direktori sejajar dengan `app/` dan `bootstrap/`.
            </div>
        <?php endif; ?>

        <?php if (! $envExists && $hasVendor): ?>
            <div class="notice-box">
                <strong>File `.env` tidak ditemukan!</strong><br>
                Di cPanel File Manager, file berawalan titik (seperti `.env`) disembunyikan secara default. Buka <strong>Settings (ikon gear di kanan atas File Manager)</strong>, lalu centang <strong>"Show Hidden Files (dotfiles)"</strong>. Kemudian salin `.env.example` menjadi `.env` dan atur database Anda.
            </div>
        <?php endif; ?>

        <?php if ($dbError): ?>
            <div class="notice-box">
                <strong>Database Error:</strong> <?= htmlspecialchars($dbError) ?><br>
                Pastikan nama database, username, dan password di file `.env` sudah sesuai dengan database MySQL yang Anda buat di cPanel (Menu: <em>MySQL Databases</em>).
            </div>
        <?php endif; ?>

        <div class="actions">
            <a href="?action=migrate_fresh" class="btn btn-primary">⚡ Jalankan migrate:fresh --seed</a>
            <a href="?action=storage_link" class="btn btn-secondary">🔗 storage:link</a>
            <a href="?action=optimize_clear" class="btn btn-secondary">🧹 optimize:clear</a>
            <a href="?action=key_generate" class="btn btn-secondary">🔑 key:generate</a>
            <a href="migrate-fresh.php" class="btn btn-secondary">🔄 Refresh Diagnosa</a>
        </div>

        <div class="terminal">
            <div class="terminal-header">
                <div class="dots">
                    <span class="dot dot-red"></span>
                    <span class="dot dot-yellow"></span>
                    <span class="dot dot-green"></span>
                </div>
                <div class="cmd-title"><?= htmlspecialchars($executedCommand ?: 'Status Output') ?></div>
                <div style="font-size: 11px; font-weight: 700; color: <?= $statusCode === 0 ? '#10b981' : '#ef4444' ?>;">
                    <?= $action ? ($statusCode === 0 ? 'SUCCESS (0)' : 'FAILED (' . $statusCode . ')') : 'READY' ?>
                </div>
            </div>
            <div class="terminal-body"><?= htmlspecialchars($output ?: "Pilih salah satu tombol di atas untuk menjalankan command.\nUntuk migrasi pertama kali, klik tombol biru: '⚡ Jalankan migrate:fresh --seed'.\n") ?></div>
        </div>

        <div class="footer">
            INSAAN HRIS Shared Hosting Helper • Lokasi Base: <code><?= htmlspecialchars($baseDir ?: 'Tidak Ditemukan') ?></code>
        </div>
    </div>
</body>
</html>
