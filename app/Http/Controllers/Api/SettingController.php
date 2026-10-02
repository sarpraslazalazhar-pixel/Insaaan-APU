<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::pluck('value', 'key');
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function show($key)
    {
        $setting = Setting::where('key', $key)->first();
        return response()->json([
            'success' => true, 
            'data' => $setting ? $setting->value : null
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($request->settings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['success' => true, 'message' => 'Pengaturan diperbarui']);
    }
}
