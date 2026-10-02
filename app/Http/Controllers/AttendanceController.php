<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $today = now()->toDateString();
        $user = Auth::user();

        // Cari pegawai terkait user yang login atau pegawai pertama
        $pegawai = Pegawai::where('email', $user->email)->first() ?? Pegawai::first();
        $pegawaiId = $pegawai ? $pegawai->id : 1;

        $userAttendanceToday = Attendance::where('pegawai_id', $pegawaiId)
            ->where('date', $today)
            ->first();

        $todayLogs = Attendance::with('pegawai')
            ->where('date', $today)
            ->orderBy('id', 'desc')
            ->take(15)
            ->get();

        $summary = [
            'hadir' => Attendance::where('date', $today)->whereIn('status', ['hadir', 'terlambat'])->count(),
            'izin' => Attendance::where('date', $today)->where('status', 'izin')->count(),
            'sakit' => Attendance::where('date', $today)->where('status', 'sakit')->count(),
            'cuti' => Attendance::where('date', $today)->where('status', 'cuti')->count(),
            'terlambat' => Attendance::where('date', $today)->where('status', 'terlambat')->count(),
        ];

        $leaveRequests = LeaveRequest::with('pegawai')->orderBy('id', 'desc')->take(10)->get();

        $overtimeRequests = [];
        $currentMonthOvertimeHours = 0;
        if (\Illuminate\Support\Facades\Schema::hasTable('overtime_requests')) {
            $overtimeRequests = DB::table('overtime_requests')
                ->join('pegawai', 'overtime_requests.pegawai_id', '=', 'pegawai.id')
                ->select('overtime_requests.*', 'pegawai.full_name')
                ->orderBy('overtime_requests.id', 'desc')
                ->take(10)
                ->get()
                ->map(function ($ot) {
                    return [
                        'id' => $ot->id,
                        'type' => $ot->type,
                        'date' => $ot->date,
                        'hours' => $ot->hours,
                        'status' => $ot->status,
                        'pegawai' => ['full_name' => $ot->full_name],
                    ];
                });

            $currentMonthOvertimeHours = DB::table('overtime_requests')
                ->where('pegawai_id', $pegawaiId)
                ->whereMonth('date', now()->month)
                ->where('status', 'approved')
                ->sum('hours');
        }

        return Inertia::render('Kehadiran/Index', [
            'summary' => $summary,
            'todayLogs' => $todayLogs,
            'userAttendanceToday' => $userAttendanceToday,
            'leaveRequests' => $leaveRequests,
            'overtimeRequests' => $overtimeRequests,
            'shifts' => [],
            'currentMonthOvertimeHours' => (int) $currentMonthOvertimeHours,
        ]);
    }

    public function clockIn(Request $request)
    {
        $user = Auth::user();
        $pegawai = Pegawai::where('email', $user->email)->first() ?? Pegawai::first();
        if (! $pegawai) {
            return back()->withErrors(['error' => 'Data amil tidak ditemukan']);
        }

        $today = now()->toDateString();
        $now = now()->toTimeString();

        Attendance::updateOrCreate(
            ['pegawai_id' => $pegawai->id, 'date' => $today],
            [
                'clock_in' => $now,
                'status' => now()->format('H:i') > '08:30' ? 'terlambat' : 'hadir',
                'method' => 'Web App',
            ]
        );

        return redirect()->route('kehadiran.index')->with('success', 'Presensi masuk berhasil dicatat pada '.$now);
    }

    public function clockOut(Request $request)
    {
        $user = Auth::user();
        $pegawai = Pegawai::where('email', $user->email)->first() ?? Pegawai::first();
        if (! $pegawai) {
            return back()->withErrors(['error' => 'Data amil tidak ditemukan']);
        }

        $today = now()->toDateString();
        $now = now()->toTimeString();

        Attendance::updateOrCreate(
            ['pegawai_id' => $pegawai->id, 'date' => $today],
            [
                'clock_out' => $now,
            ]
        );

        return redirect()->route('kehadiran.index')->with('success', 'Presensi pulang berhasil dicatat pada '.$now);
    }

    public function storeLeave(Request $request)
    {
        $request->validate([
            'type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'reason' => 'required|string',
        ]);

        $user = Auth::user();
        $pegawai = Pegawai::where('email', $user->email)->first() ?? Pegawai::find($user->employee_id) ?? Pegawai::first();

        LeaveRequest::create([
            'employee_id' => $pegawai->id,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        $posTitleLower = strtolower($pegawai?->current_position ?? '');
        $jobLevelLower = strtolower($pegawai?->job_level ?? '');
        $empLevel = $pegawai?->level ?? 5;

        $isDirectToHrd = (
            $empLevel <= 3 ||
            str_contains($jobLevelLower, 'direktur utama') ||
            str_contains($jobLevelLower, 'direksi') ||
            str_contains($jobLevelLower, 'kepala divisi') ||
            str_contains($jobLevelLower, 'kadiv') ||
            str_contains($jobLevelLower, 'manager') ||
            str_contains($posTitleLower, 'direktur') ||
            str_contains($posTitleLower, 'kepala divisi') ||
            str_contains($posTitleLower, 'manager') ||
            str_contains($posTitleLower, 'kadiv') ||
            ! $pegawai?->manager_id
        );

        $msg = $isDirectToHrd
            ? 'Pengajuan cuti Anda telah diteruskan langsung ke Divisi SDM / HRD untuk diverifikasi.'
            : 'Pengajuan cuti berhasil dikirim ke atasan langsung Anda.';

        return redirect()->route('kehadiran.index')->with('success', $msg);
    }

    public function storeOvertime(Request $request)
    {
        $request->validate([
            'type' => 'required|in:before_shift,after_shift',
            'date' => 'required|date',
            'hours' => 'required|integer|min:1|max:12',
            'reason' => 'required|string',
        ]);

        $user = Auth::user();
        $pegawai = Pegawai::where('email', $user->email)->first() ?? Pegawai::first();

        if (\Illuminate\Support\Facades\Schema::hasTable('overtime_requests')) {
            DB::table('overtime_requests')->insert([
                'pegawai_id' => $pegawai->id,
                'type' => $request->type,
                'date' => $request->date,
                'start_time' => $request->start_time ?? '17:00:00',
                'end_time' => $request->end_time ?? '19:00:00',
                'hours' => $request->hours,
                'rate_per_hour' => 10000,
                'reason' => $request->reason,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return redirect()->route('kehadiran.index')->with('success', 'Pengajuan lembur berhasil diajukan.');
    }
}
