<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ApprovalController extends Controller
{
    public function index()
    {
        $currentUser = Auth::user();
        $userRole = $currentUser?->role?->name ?? 'staf_viewer';
        $myPegawaiId = $currentUser?->employee_id ?? null;

        $pending = [];
        $history = [];

        // 1. Cuti
        $leaves = LeaveRequest::with(['pegawai.orgUnit', 'pegawai.position', 'pegawai.manager'])->orderBy('id', 'desc')->get();
        foreach ($leaves as $l) {
            $emp = $l->pegawai;
            $unit = $emp?->orgUnit;
            $isAdhoc = $unit && ($unit->type !== 'formal' || ! $unit->is_official);

            // Aturan Bisnis PRD: Direktur Utama, Kadiv, dan Manager kalau mau cuti LANGSUNG KE HRD!
            $posTitleLower = strtolower($emp?->current_position ?? ($emp?->position?->name ?? ''));
            $jobLevelLower = strtolower($emp?->job_level ?? '');
            $empLevel = $emp?->level ?? ($emp?->position?->level ?? 5);

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
                ! $emp?->manager_id
            );

            if ($isDirectToHrd) {
                $approvalRoute = 'Langsung ke HRD (Direktur Utama / Kadiv / Manager)';
                $approverTarget = 'hrd';
            } else {
                $approvalRoute = $emp?->manager ? 'Atasan Langsung: '.$emp->manager->full_name : 'Langsung ke HRD';
                $approverTarget = 'atasan';
            }

            // Visibility filtering per Role
            $canView = false;
            if ($userRole === 'super_admin' || $userRole === 'admin_hr') {
                $canView = true;
            } elseif ($userRole === 'manager_divisi') {
                if ($emp && $emp->manager_id == $myPegawaiId && ! $isDirectToHrd) {
                    $canView = true;
                }
            } elseif ($emp && $emp->id == $myPegawaiId) {
                $canView = true;
            }

            if (! $canView) {
                continue;
            }

            $item = [
                'id' => $l->id,
                'document_type' => 'cuti',
                'applicant_name' => $emp->full_name ?? 'Amil',
                'applicant_dept' => $unit->name ?? ($emp->departement ?? 'Umum'),
                'unit_type' => $unit->type ?? 'formal',
                'is_official' => $unit ? $unit->is_official : true,
                'is_direct_to_hrd' => $isDirectToHrd,
                'approval_route' => $approvalRoute,
                'title' => 'Pengajuan Cuti '.$l->type,
                'description' => $l->reason ?: 'Cuti amil',
                'date' => $l->start_date.' s/d '.$l->end_date,
                'status' => $l->status === 'approved' ? 'Disetujui' : ($l->status === 'rejected' ? 'Ditolak' : 'Menunggu'),
            ];
            if ($l->status === 'pending') {
                $pending[] = $item;
            } else {
                $history[] = $item;
            }
        }

        // 2. Lembur
        if (\Illuminate\Support\Facades\Schema::hasTable('overtime_requests')) {
            $overtimes = DB::table('overtime_requests')
                ->join('pegawai', 'overtime_requests.pegawai_id', '=', 'pegawai.id')
                ->select('overtime_requests.*', 'pegawai.full_name', 'pegawai.departement')
                ->orderBy('overtime_requests.id', 'desc')
                ->get();

            foreach ($overtimes as $ot) {
                $item = [
                    'id' => $ot->id,
                    'document_type' => 'lembur',
                    'applicant_name' => $ot->full_name,
                    'applicant_dept' => $ot->departement ?? 'Umum',
                    'title' => 'Lembur '.$ot->hours.' Jam ('.($ot->type === 'before_shift' ? 'Before' : 'After').' Shift)',
                    'description' => $ot->reason ?: 'Penugasan lembur',
                    'date' => $ot->date,
                    'status' => $ot->status === 'approved' ? 'Disetujui' : ($ot->status === 'rejected' ? 'Ditolak' : 'Menunggu'),
                ];
                if ($ot->status === 'pending') {
                    $pending[] = $item;
                } else {
                    $history[] = $item;
                }
            }
        }

        // 3. Reimbursement
        if (\Illuminate\Support\Facades\Schema::hasTable('reimbursements')) {
            $claims = DB::table('reimbursements')
                ->join('pegawai', 'reimbursements.pegawai_id', '=', 'pegawai.id')
                ->select('reimbursements.*', 'pegawai.full_name', 'pegawai.departement')
                ->orderBy('reimbursements.id', 'desc')
                ->get();

            foreach ($claims as $cl) {
                $item = [
                    'id' => $cl->id,
                    'document_type' => 'reimbursement',
                    'applicant_name' => $cl->full_name,
                    'applicant_dept' => $cl->departement ?? 'Umum',
                    'title' => 'Klaim '.$cl->category.' (Rp '.number_format($cl->amount, 0, ',', '.').')',
                    'description' => $cl->description ?: 'Operasional amil',
                    'date' => $cl->date,
                    'status' => $cl->status === 'approved' || $cl->status === 'paid' ? 'Disetujui' : ($cl->status === 'rejected' ? 'Ditolak' : 'Menunggu'),
                ];
                if ($cl->status === 'pending') {
                    $pending[] = $item;
                } else {
                    $history[] = $item;
                }
            }
        }

        return Inertia::render('Approvals/Index', [
            'pendingApprovals' => $pending,
            'historyApprovals' => $history,
        ]);
    }

    public function approve($type, $id)
    {
        if ($type === 'cuti') {
            LeaveRequest::where('id', $id)->update(['status' => 'approved']);
        } elseif ($type === 'lembur' && \Illuminate\Support\Facades\Schema::hasTable('overtime_requests')) {
            DB::table('overtime_requests')->where('id', $id)->update(['status' => 'approved']);
        } elseif ($type === 'reimbursement' && \Illuminate\Support\Facades\Schema::hasTable('reimbursements')) {
            DB::table('reimbursements')->where('id', $id)->update(['status' => 'approved']);
        }

        return redirect()->route('approvals.index')->with('success', 'Permohonan berhasil disetujui.');
    }

    public function reject(Request $request, $type, $id)
    {
        $reason = $request->input('reason', 'Tidak memenuhi kualifikasi');

        if ($type === 'cuti') {
            LeaveRequest::where('id', $id)->update(['status' => 'rejected']);
        } elseif ($type === 'lembur' && \Illuminate\Support\Facades\Schema::hasTable('overtime_requests')) {
            DB::table('overtime_requests')->where('id', $id)->update(['status' => 'rejected']);
        } elseif ($type === 'reimbursement' && \Illuminate\Support\Facades\Schema::hasTable('reimbursements')) {
            DB::table('reimbursements')->where('id', $id)->update(['status' => 'rejected']);
        }

        return redirect()->route('approvals.index')->with('success', 'Permohonan ditolak dengan alasan: '.$reason);
    }
}
