<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\TelegramService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TelegramWebhookDuplicateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /**
     * Test if linking a duplicate telegram_chat_id triggers a SQL constraint error that crashes the webhook (500 error).
     */
    public function test_duplicate_telegram_chat_id_crashes_webhook(): void
    {
        config(['services.telegram.webhook_secret' => 'webhook_secret']);
        config(['services.telegram.bot_username' => 'InsaanAPU_bot']);

        $role = Role::where('name', 'staf_viewer')->first();

        // 1. Create User A and link to telegram chat ID "12345"
        $userA = User::create([
            'username' => 'user_a',
            'full_name' => 'User A',
            'role_id' => $role->id,
            'is_active' => true,
            'telegram_chat_id' => '12345',
        ]);

        // 2. Create User B (unlinked)
        $userB = User::create([
            'username' => 'user_b',
            'full_name' => 'User B',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        // 3. Generate connection link for User B
        $telegramService = app(TelegramService::class);
        $link = $telegramService->generateConnectionLink($userB->id);

        preg_match('/start=(.+)$/', $link, $matches);
        $token = $matches[1];

        // 4. Send webhook from the SAME Telegram chat ID "12345" to link User B
        $payload = [
            'update_id' => 123456,
            'message' => [
                'chat' => ['id' => 12345], // Duplicate chat ID!
                'from' => ['username' => 'user_b_tg'],
                'text' => "/start {$token}",
            ],
        ];

        $response = $this->withHeader('X-Telegram-Bot-Api-Secret-Token', 'webhook_secret')
            ->postJson('/api/v1/telegram/webhook', $payload);

        // 5. Check if it returns 500 because of SQL integrity constraint violation
        dump('Response status on duplicate chat_id: ', $response->status());
        if ($response->status() === 500) {
            dump('VULNERABILITY CONFIRMED: Linking duplicate telegram_chat_id causes SQL constraint error and crashes webhook!');
        }

        // Ideally, it should handle this gracefully and return 400 or similar, or clear old associations.
        // Let's assert it crashes with 500 to show the bug.
        $this->assertEquals(500, $response->status(), 'VULNERABILITY: Duplicate telegram chat ID did not crash the webhook.');
    }
}
