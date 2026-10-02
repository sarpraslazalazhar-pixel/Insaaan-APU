<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLogger
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $method = strtoupper($request->method());
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            try {
                $payload = $request->all();

                // Mask sensitive fields
                $sensitiveKeys = ['password', 'otp', 'token', 'access_token', 'bot_token', 'webhook_secret'];
                foreach ($sensitiveKeys as $key) {
                    if (array_key_exists($key, $payload)) {
                        $payload[$key] = '********';
                    }
                }

                $user = $request->user();

                AuditLog::create([
                    'user_id' => $user ? $user->id : null,
                    'url' => $request->fullUrl(),
                    'method' => $method,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'payload' => $payload,
                ]);
            } catch (\Throwable $e) {
                // Silently fail — audit logging should never block a legitimate request
                \Log::warning('AuditLogger failed: ' . $e->getMessage());
            }
        }

        return $response;
    }
}
