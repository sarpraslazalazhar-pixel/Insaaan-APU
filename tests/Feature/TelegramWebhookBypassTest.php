<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\TelegramService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TelegramWebhookBypassTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /**
     * Verify that when TELEGRAM_WEBHOOK_SECRET is not configured (e.g. empty or null),
     * the webhook completely bypasses verification and allows any payload.
     */
    public function test_webhook_bypassed_when_secret_not_configured(): void
    {
        // 1. Ensure secret is not configured
        config(['services.telegram.webhook_secret' => null]);
        config(['services.telegram.bot_username' => 'InsaanAPU_bot']);

        $role = Role::where('name', 'staf_viewer')->first();
        $user = User::create([
            'username' => 'karyawan_tg_bypass',
            'full_name' => 'Karyawan Telegram Bypass',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        $telegramService = app(TelegramService::class);
        $link = $telegramService->generateConnectionLink($user->id);

        preg_match('/start=(.+)$/', $link, $matches);
        $token = $matches[1];

        $payload = [
            'update_id' => 123456,
            'message' => [
                'chat' => ['id' => 99999999],
                'from' => ['username' => 'attacker_tg'],
                'text' => "/start {$token}",
            ],
        ];

        // 2. Call the webhook WITHOUT any secret header
        $response = $this->postJson('/api/v1/telegram/webhook', $payload);

        // 3. Under a secure implementation, this should fail with 403 or 500 (since webhook secret is required)
        // But here it will return 200 because it bypasses the validation.
        dump('Response status when secret is null and header is missing: ', $response->status());
        if ($response->status() === 200) {
            dump('VULNERABILITY CONFIRMED: Telegram webhook signature verification is bypassed when webhook_secret is null!');
        }

        $this->assertEquals(200, $response->status());

        // Verify that the attacker successfully linked their chat ID
        $user->refresh();
        $this->assertEquals('99999999', $user->telegram_chat_id);
    }
}
