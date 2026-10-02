<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TelegramService;
use Illuminate\Http\Request;

class TelegramWebhookController extends Controller
{
    protected $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    public function handle(Request $request)
    {
        $secretToken = $request->header('X-Telegram-Bot-Api-Secret-Token');
        $expectedSecret = config('services.telegram.webhook_secret');

        // Only enforce check if a secret is configured
        if ($expectedSecret && $secretToken !== $expectedSecret) {
            abort(403, 'Unauthorized.');
        }

        $payload = $request->all();
        $this->telegramService->handleWebhook($payload);

        return response()->json(['status' => 'ok'], 200);
    }
}
