<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with('pegawai');

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('pegawai_id')) {
            $query->where('pegawai_id', $request->pegawai_id);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function todaySummary()
    {
        $today = now()->format('Y-m-d');
        $attendances = Attendance::where('date', $today)->get();

        $summary = [
            'hadir' => $attendances->whereIn('status', ['hadir', 'terlambat'])->count(),
            'izin' => $attendances->where('status', 'izin')->count(),
            'sakit' => $attendances->where('status', 'sakit')->count(),
            'cuti' => $attendances->where('status', 'cuti')->count(),
            'terlambat' => $attendances->where('status', 'terlambat')->count(),
        ];

        return response()->json(['success' => true, 'data' => $summary]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pegawai_id' => 'required|exists:pegawai,id',
            'date' => 'required|date',
            'clock_in' => 'nullable|date_format:H:i:s',
            'clock_out' => 'nullable|date_format:H:i:s',
            'status' => 'required|string',
            'method' => 'nullable|string',
            'location' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $attendance = Attendance::updateOrCreate(
            ['pegawai_id' => $validated['pegawai_id'], 'date' => $validated['date']],
            $validated
        );

        return response()->json(['success' => true, 'data' => $attendance]);
    }

    public function clockIn(Request $request)
    {
        $validated = $request->validate([
            'pegawai_id' => 'required|exists:pegawai,id',
            'method' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        $attendance = Attendance::firstOrCreate(
            ['pegawai_id' => $validated['pegawai_id'], 'date' => now()->format('Y-m-d')],
            [
                'clock_in' => now()->format('H:i:s'),
                'status' => 'hadir',
                'method' => $validated['method'] ?? null,
                'location' => $validated['location'] ?? null,
            ]
        );

        // Jika sudah ada tapi clock in belum diisi
        if (!$attendance->wasRecentlyCreated && !$attendance->clock_in) {
            $attendance->update([
                'clock_in' => now()->format('H:i:s'),
                'status' => 'hadir',
                'method' => $validated['method'] ?? $attendance->method,
                'location' => $validated['location'] ?? $attendance->location,
            ]);
        }

        return response()->json(['success' => true, 'data' => $attendance]);
    }

    public function clockOut(Request $request)
    {
        $validated = $request->validate([
            'pegawai_id' => 'required|exists:pegawai,id',
        ]);

        $attendance = Attendance::where('pegawai_id', $validated['pegawai_id'])
            ->where('date', now()->format('Y-m-d'))
            ->firstOrFail();

        $attendance->update([
            'clock_out' => now()->format('H:i:s')
        ]);

        return response()->json(['success' => true, 'data' => $attendance]);
    }
}
