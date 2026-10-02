<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $totalActive = Pegawai::where('is_active', true)->count();
        $totalTetap = Pegawai::where('employment_status', 'Tetap')->count();
        $totalKontrak = Pegawai::where('employment_status', 'Kontrak')->count();
        $totalRelawan = Pegawai::where('employment_status', 'Relawan')->count();

        $genderMale = Pegawai::where('gender', 'L')->count();
        $genderFemale = Pegawai::where('gender', 'P')->count();

        $kontrakExpiring = Pegawai::whereNotNull('contract_end_date')
            ->where('contract_end_date', '>=', now())
            ->where('contract_end_date', '<=', now()->addDays(30))
            ->count();
            
        $birthdays = Pegawai::whereNotNull('date_of_birth')
            ->whereMonth('date_of_birth', now()->month)
            ->count();
            
        $probationExpiring = Pegawai::where('employment_status', 'Kontrak')
            ->whereNotNull('join_date')
            ->where('join_date', '>=', now()->subMonths(3))
            ->count();

        $recentJoins = Pegawai::orderBy('join_date', 'desc')->take(5)->get()->map(function($p) {
            return [
                'id' => $p->employee_id ?? $p->id,
                'name' => $p->full_name,
                'position' => $p->current_position ?? 'Staf',
                'division' => $p->departement ?? 'Umum',
                'status' => strtoupper($p->employment_status ?? 'KONTRAK'),
                'joinedDate' => $p->join_date ? Carbon::parse($p->join_date)->format('Y-m-d') : '-',
            ];
        });
        
        $divisions = Pegawai::select('departement', DB::raw('count(*) as total'))
            ->whereNotNull('departement')
            ->groupBy('departement')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->departement ?: 'Lainnya' => $item->total];
            });

        $levels = Pegawai::select('job_level', DB::raw('count(*) as total'))
            ->whereNotNull('job_level')
            ->groupBy('job_level')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->job_level ?: 'Staf' => $item->total];
            });

        // 1. Chart Data (Tren Ketidakhadiran 6 Bulan Terakhir)
        $chartData = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->startOfMonth()->subMonths($i);
            $monthName = $date->translatedFormat('M'); // Agu, Sep, dll
            
            $absences = DB::table('attendances')
                ->whereYear('tanggal', $date->year)
                ->whereMonth('tanggal', $date->month)
                ->whereIn('status', ['izin', 'cuti', 'sakit', 'alpa'])
                ->count();
                
            $chartData->push([
                'month' => $monthName,
                'value' => $absences,
            ]);
        }
        $maxChart = $chartData->max('value') ?: 1;
        if ($maxChart < 5) $maxChart = 5; // minimum scale
        
        $chartData = $chartData->map(function($d) use ($maxChart) {
            $d['heightPct'] = min(100, round(($d['value'] / $maxChart) * 100));
            return $d;
        });

        // 2. Activity Feed
        $activities = collect();
        
        $recentEmps = Pegawai::orderBy('created_at', 'desc')->take(3)->get();
        foreach($recentEmps as $emp) {
            $activities->push([
                'id' => 'emp_'.$emp->id,
                'title' => 'Karyawan Baru',
                'description' => $emp->full_name . ' bergabung di divisi ' . ($emp->departement ?? 'Umum'),
                'time' => $emp->created_at->diffForHumans(),
                'timestamp' => $emp->created_at->timestamp,
                'type' => 'person_add',
            ]);
        }
        
        $recentLeaves = DB::table('leave_requests')
            ->join('pegawai', 'leave_requests.employee_id', '=', 'pegawai.id')
            ->select('leave_requests.*', 'pegawai.full_name')
            ->orderBy('leave_requests.updated_at', 'desc')
            ->take(3)
            ->get();
            
        foreach($recentLeaves as $leave) {
            $status = $leave->status;
            $type = 'update';
            if ($status == 'approved') $type = 'check_circle';
            if ($status == 'rejected') $type = 'cancel';
            
            $activities->push([
                'id' => 'lv_'.$leave->id,
                'title' => 'Pengajuan ' . $leave->type,
                'description' => $leave->full_name . ' - Status: ' . ucfirst($status),
                'time' => Carbon::parse($leave->updated_at)->diffForHumans(),
                'timestamp' => Carbon::parse($leave->updated_at)->timestamp,
                'type' => $type,
            ]);
        }

        $sortedActivities = $activities->sortByDesc('timestamp')->take(5)->values()->map(function($a) {
            unset($a['timestamp']);
            return $a;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'total_active' => $totalActive,
                'total_tetap' => $totalTetap,
                'total_kontrak' => $totalKontrak,
                'total_relawan' => $totalRelawan,
                'gender_male' => $genderMale,
                'gender_female' => $genderFemale,
                'kontrak_expiring_30_days' => $kontrakExpiring,
                'birthdays_this_month' => $birthdays,
                'probation_expiring' => $probationExpiring,
                'recent_joins' => $recentJoins,
                'divisions' => $divisions,
                'levels' => $levels,
                'chart_data' => $chartData,
                'activities' => $sortedActivities,
            ]
        ]);
    }
}
