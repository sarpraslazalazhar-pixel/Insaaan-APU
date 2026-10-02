<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
        ]);

        $loginInput = trim($request->username);
        $user = User::with(['role', 'pegawai'])->where(function ($q) use ($loginInput) {
            $q->where('username', $loginInput)
              ->orWhere('email', $loginInput);
        })->first();

        // Auto-provision Super Admin jika user belum ada
        if (! $user) {
            $superAdminRole = Role::firstOrCreate(
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
            return back()->withErrors([
                'username' => 'Akun amil tidak aktif. Silakan hubungi Admin HR.',
            ]);
        }

        $user->update([
            'last_login' => now(),
            'last_login_platform' => 'web',
        ]);

        Auth::login($user, $request->boolean('remember', true));
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'))->with('success', 'Selamat datang kembali, '.$user->full_name);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Anda telah berhasil keluar.');
    }
}
