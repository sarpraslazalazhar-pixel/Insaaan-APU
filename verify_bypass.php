<?php

use Illuminate\Contracts\Console\Kernel;
use App\Models\User;
use App\Models\Role;
use App\Models\OtpToken;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

define('LARAVEL_START', microtime(true));

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

echo "Laravel bootstrapped successfully. Database: " . config('database.default') . "\n";

// Helper to print test results
function reportResult($testName, $passed, $details = "") {
    $status = $passed ? "\033[32mPASSED\033[0m" : "\033[31mFAILED\033[0m";
    echo "[$status] $testName" . ($details ? " - $details" : "") . "\n";
}

// 1. Setup test user
$role = Role::firstOrCreate(['name' => 'staf_viewer']);
$username = 'Àl-Azhar-Stress';
$lowercaseUsername = 'àl-azhar-stress';

// Clean up any existing test user
User::where('username', $username)->delete();

$user = User::create([
    'username' => $username,
    'full_name' => 'Stress Test User',
    'role_id' => $role->id,
    'is_active' => true,
    'telegram_chat_id' => '99998888',
]);

echo "Created test user '$username' with ID: {$user->id}\n";

// 2. Verify MySQL collation case-insensitivity
$foundUser = User::where('username', $lowercaseUsername)->first();
$collationBypassPossible = $foundUser && ($foundUser->id === $user->id);
reportResult(
    "MySQL Collation Case Insensitivity",
    $collationBypassPossible,
    $collationBypassPossible 
        ? "MySQL matched '$lowercaseUsername' with '$username' (ID: {$foundUser->id})" 
        : "MySQL did not match. Query returned null."
);

if (!$collationBypassPossible) {
    echo "MySQL collation case insensitivity is not present (or not running on MySQL). Aborting bypass tests.\n";
    $user->delete();
    exit(1);
}

// Instantiate AuthController
$authController = app(AuthController::class);

// --- TEST 1: Standard OTP Request Rate Limiting (3 attempts) ---
$rateLimitKey = 'otp-request:' . strtolower($username);
RateLimiter::clear($rateLimitKey);

$successCount = 0;
$blockedCount = 0;

for ($i = 1; $i <= 4; $i++) {
    $request = Request::create('/api/v1/auth/send-otp', 'POST', ['username' => $username]);
    $response = $authController->sendOtp($request);
    
    if ($response->getStatusCode() === 200) {
        $successCount++;
    } elseif ($response->getStatusCode() === 429) {
        $blockedCount++;
    }
}

$standardRateLimitPassed = ($successCount === 3 && $blockedCount === 1);
reportResult(
    "Standard OTP Request Rate Limiting (3 attempts)",
    $standardRateLimitPassed,
    "Success: $successCount, Blocked (429): $blockedCount"
);

// --- TEST 2: OTP Request Rate Limiting Bypass via UTF-8 Casing Mismatch ---
// We now try to send OTP using the lowercase username variant
$bypassKey = 'otp-request:' . strtolower($lowercaseUsername);
RateLimiter::clear($bypassKey); // clear it to start clean for this key

// Note: PHP strtolower("Àl-Azhar-Stress") => "Àl-azhar-stress" (À remains uppercase)
// PHP strtolower("àl-azhar-stress") => "àl-azhar-stress" (à remains lowercase)
// These two generate different cache keys!
// But when sent to Eloquent/MySQL:
// User::where('username', 'àl-azhar-stress')->first() will match 'Àl-Azhar-Stress'.

$requestBypass = Request::create('/api/v1/auth/send-otp', 'POST', ['username' => $lowercaseUsername]);
$responseBypass = $authController->sendOtp($requestBypass);

// Check if OTP token was generated
$otpCount = OtpToken::where('user_id', $user->id)->count();

$bypassSuccess = ($responseBypass->getStatusCode() === 200 && $otpCount === 4);
reportResult(
    "OTP Request Rate Limiting Bypass via UTF-8 Casing Mismatch",
    $bypassSuccess,
    "Response Status: " . $responseBypass->getStatusCode() . ", OTP Tokens generated: $otpCount (Expected 4)"
);


// --- TEST 3: Standard OTP Verification Lockout (5 attempts) ---
$lockoutKey = 'otp-verify-lockout:' . strtolower($username);
RateLimiter::clear($lockoutKey);

// Generate an OTP first
$request = Request::create('/api/v1/auth/send-otp', 'POST', ['username' => $username]);
RateLimiter::clear($rateLimitKey); // clear it to allow sending OTP
$authController->sendOtp($request);

$verifySuccessCount = 0;
$verifyBlockedCount = 0;

for ($i = 1; $i <= 6; $i++) {
    $request = Request::create('/api/v1/auth/verify-otp', 'POST', [
        'username' => $username,
        'otp' => '000000' // Wrong OTP
    ]);
    $response = $authController->verifyOtp($request);
    
    if ($response->getStatusCode() === 401) {
        $verifySuccessCount++;
    } elseif ($response->getStatusCode() === 429) {
        $verifyBlockedCount++;
    }
}

$standardLockoutPassed = ($verifySuccessCount === 5 && $verifyBlockedCount === 1);
reportResult(
    "Standard OTP Verification Lockout (5 attempts)",
    $standardLockoutPassed,
    "Failed Attempts Allowed: $verifySuccessCount, Blocked (429): $verifyBlockedCount"
);


// --- TEST 4: OTP Verification Lockout Bypass via UTF-8 Casing Mismatch ---
// We clear keys to start clean
RateLimiter::clear('otp-verify-lockout:' . strtolower($username));
RateLimiter::clear('otp-verify-lockout:' . strtolower($lowercaseUsername));

// We perform 4 wrong attempts on 'Àl-Azhar-Stress' (should return 401)
$u1Attempts = 0;
for ($i = 0; $i < 4; $i++) {
    $request = Request::create('/api/v1/auth/verify-otp', 'POST', [
        'username' => $username,
        'otp' => '000000'
    ]);
    $response = $authController->verifyOtp($request);
    if ($response->getStatusCode() === 401) $u1Attempts++;
}

// We perform 4 wrong attempts on 'àl-azhar-stress' (should also return 401 if bypassed, instead of 429 lockout)
$u2Attempts = 0;
for ($i = 0; $i < 4; $i++) {
    $request = Request::create('/api/v1/auth/verify-otp', 'POST', [
        'username' => $lowercaseUsername,
        'otp' => '000000'
    ]);
    $response = $authController->verifyOtp($request);
    if ($response->getStatusCode() === 401) $u2Attempts++;
}

$lockoutBypassSuccess = ($u1Attempts === 4 && $u2Attempts === 4);
reportResult(
    "OTP Verification Lockout Bypass via UTF-8 Casing Mismatch",
    $lockoutBypassSuccess,
    "Allowed 401 attempts on target: $u1Attempts, Allowed 401 attempts on variant: $u2Attempts (Total 8 attempts without lockout)"
);

// Clean up
$user->delete();
echo "Cleanup completed. Test user deleted.\n";
