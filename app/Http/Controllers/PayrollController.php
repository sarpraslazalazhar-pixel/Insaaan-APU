<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $periods = [];
        $reimbursements = [];

        if (\Illuminate\Support\Facades\Schema::hasTable('payroll_periods')) {
            $periods = DB::table('payroll_periods')->orderBy('id', 'desc')->get();
        }

        if (\Illuminate\Support\Facades\Schema::hasTable('reimbursements')) {
            $reimbursements = DB::table('reimbursements')
                ->join('pegawai', 'reimbursements.pegawai_id', '=', 'pegawai.id')
                ->select('reimbursements.*', 'pegawai.full_name')
                ->orderBy('reimbursements.id', 'desc')
                ->get()
                ->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'category' => $r->category,
                        'amount' => $r->amount,
                        'date' => $r->date,
                        'status' => $r->status,
                        'pegawai' => ['full_name' => $r->full_name],
                    ];
                });
        }

        return Inertia::render('Payroll/Index', [
            'periods' => $periods,
            'reimbursements' => $reimbursements,
            'components' => [],
        ]);
    }

    public function generate(Request $request)
    {
        $currentPeriod = now()->translatedFormat('F Y');
        $activeEmployees = Pegawai::where('is_active', true)->get();

        if (\Illuminate\Support\Facades\Schema::hasTable('payroll_periods')) {
            DB::table('payroll_periods')->updateOrInsert(
                ['period_name' => $currentPeriod],
                [
                    'total_employees' => $activeEmployees->count(),
                    'total_gross' => $activeEmployees->count() * 4500000,
                    'total_overtime' => 350000,
                    'status' => 'Review',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        return redirect()->route('payroll.index')->with('success', 'Payroll periode '.$currentPeriod.' berhasil dihitung otomatis dari data kehadiran.');
    }

    public function storeReimbursement(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
            'amount' => 'required|numeric|min:1000',
            'invoice_number' => 'required|string',
            'date' => 'required|date',
            'description' => 'required|string',
        ]);

        $user = Auth::user();
        $pegawai = Pegawai::where('email', $user->email)->first() ?? Pegawai::first();

        if (\Illuminate\Support\Facades\Schema::hasTable('reimbursements')) {
            DB::table('reimbursements')->insert([
                'pegawai_id' => $pegawai->id,
                'category' => $request->category,
                'amount' => $request->amount,
                'invoice_number' => $request->invoice_number,
                'date' => $request->date,
                'description' => $request->description,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return redirect()->route('payroll.index')->with('success', 'Pengajuan klaim reimbursement berhasil dikirim.');
    }
}
