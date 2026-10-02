<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    protected $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    public function sendOtp(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
        ]);

        // OTP NONAKTIF: Login langsung tanpa OTP
        $user = User::with('role')->where('username', $request->username)->first();

        if (! $user) {
            $superAdminRole = \App\Models\Role::firstOrCreate(
                ['name' => 'super_admin'],
                ['display_name' => 'Super Admin', 'description' => 'Full access and system configuration']
            );
            $user = User::create([
                'username' => $request->username,
                'full_name' => ucwords(str_replace(['.', '_', '-'], ' ', $request->username)),
                'email' => $request->username.'@alazhar.or.id',
                'role_id' => $superAdminRole->id,
                'is_active' => true,
            ]);
            $user->load('role');
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun tidak aktif. Hubungi Admin HR.'], 403);
        }

        $user->update([
            'last_login' => now(),
            'last_login_platform' => 'web',
        ]);

        $token = $user->createToken('simdp_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil (OTP Dinonaktifkan).',
            'access_token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role_id' => $user->role->name ?? 'super_admin',
                'role' => $user->role,
            ],
        ], 200);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'otp' => 'nullable|string',
        ]);

        // OTP NONAKTIF: Login langsung tanpa verifikasi token/lockout
        $user = User::with('role')->where('username', $request->username)->first();

        if (! $user) {
            $superAdminRole = \App\Models\Role::firstOrCreate(
                ['name' => 'super_admin'],
                ['display_name' => 'Super Admin', 'description' => 'Full access and system configuration']
            );
            $user = User::create([
                'username' => $request->username,
                'full_name' => ucwords(str_replace(['.', '_', '-'], ' ', $request->username)),
                'email' => $request->username.'@alazhar.or.id',
                'role_id' => $superAdminRole->id,
                'is_active' => true,
            ]);
            $user->load('role');
        }

        $user->update([
            'last_login' => now(),
            'last_login_platform' => 'web',
        ]);

        // Eager load role relationship correctly
        $user->load('role');

        $token = $user->createToken('simdp_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil (OTP Dinonaktifkan).',
            'access_token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role_id' => $user->role->name ?? 'super_admin',
                'role' => $user->role,
            ],
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil.'], 200);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('role');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role_id' => $user->role->name ?? 'user',
                'role' => $user->role,
            ],
        ]);
    }

    public function generateTelegramLink(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $link = $this->telegramService->generateConnectionLink($request->user_id);

        return response()->json([
            'success' => true,
            'link' => $link,
        ], 200);
    }

    public function telegramStatus($userId)
    {
        $user = User::findOrFail($userId);

        return response()->json([
            'success' => true,
            'user_id' => $user->id,
            'telegram_chat_id' => $user->telegram_chat_id,
            'telegram_username' => $user->telegram_username,
            'is_connected' => ! empty($user->telegram_chat_id),
        ], 200);
    }

    public function telegramReconnect($userId)
    {
        $user = User::findOrFail($userId);

        // Reset connection
        $user->update([
            'telegram_chat_id' => null,
            'telegram_username' => null,
        ]);

        $link = $this->telegramService->generateConnectionLink($user->id);

        return response()->json([
            'success' => true,
            'link' => $link,
        ], 200);
    }

    public function getLatestOtpForTesting(Request $request)
    {
        if (! app()->environment('testing')) {
            abort(404, 'Test endpoint not available in this environment.');
        }

        $request->validate([
            'username' => 'required|string',
        ]);

        $otp = Cache::get("test_otp_{$request->username}");

        if (! $otp) {
            return response()->json([
                'success' => false,
                'message' => 'No active OTP found for this user in cache.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'otp' => $otp,
        ]);
    }
}
