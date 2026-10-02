<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TelegramService
{
    protected $botToken;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token') ?? env('TELEGRAM_BOT_TOKEN', 'dummy-token-for-dev');
    }

    public function generateConnectionLink(int $userId): string
    {
        $token = Str::random(32);
        Cache::put("tg_connect_token_{$token}", $userId, now()->addHours(24));

        $botUsername = config('services.telegram.bot_username', 'InsaanAPU_bot');

        return "https://t.me/{$botUsername}?start={$token}";
    }

    public function handleWebhook(array $update): void
    {
        $message = $update['message'] ?? null;
        if (! $message) {
            return;
        }

        $text = $message['text'] ?? '';
        $chatId = $message['chat']['id'] ?? null;
        $username = $message['from']['username'] ?? null;

        if ($chatId && preg_match('/^\/start\s+([A-Za-z0-9]+)$/', $text, $matches)) {
            $token = $matches[1];
            $userId = Cache::get("tg_connect_token_{$token}");

            if ($userId) {
                $user = User::find($userId);
                if ($user) {
                    $user->update([
                        'telegram_chat_id' => (string) $chatId,
                        'telegram_username' => $username,
                    ]);

                    Cache::forget("tg_connect_token_{$token}");

                    $successMsg = 'Akun InsaanAPU Anda berhasil dihubungkan! Anda sekarang dapat menerima kode OTP untuk login.';
                    $this->sendMessage((string) $chatId, $successMsg);
                }
            }
        }
    }

    public function sendOtp(string $chatId, string $otp): bool
    {
        if (app()->environment('testing')) {
            $username = null;
            if (str_starts_with($chatId, 'test_chat_')) {
                $username = substr($chatId, 10);
            } else {
                $user = User::where('telegram_chat_id', $chatId)->first();
                if ($user) {
                    $username = $user->username;
                }
            }

            if ($username) {
                Cache::put("test_otp_{$username}", $otp, now()->addMinutes(10));
            }
            Cache::put("test_otp_chat_{$chatId}", $otp, now()->addMinutes(10));

            Log::info("MOCK_TELEGRAM_OTP: Sent OTP {$otp} to user ".($username ?? 'unknown')." (chat_id: {$chatId})");

            return true;
        }

        $message = "🔐 *Kode OTP InsaanAPU*\n\nKode OTP Anda adalah: *$otp*\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.";

        return $this->sendMessage($chatId, $message);
    }

    public function sendMessage(string $chatId, string $message): bool
    {
        // For development without real telegram token, just log it
        if ($this->botToken === 'dummy-token-for-dev' || env('APP_ENV') === 'testing') {
            Log::info("Telegram Message to $chatId: $message");

            return true;
        }

        try {
            $response = Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown',
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Failed to send Telegram message: '.$e->getMessage());

            return false;
        }
    }
}
