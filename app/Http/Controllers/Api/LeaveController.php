<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveRequest::with('pegawai', 'approver');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('pegawai_id')) {
            $query->where('pegawai_id', $request->pegawai_id);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pegawai_id' => 'required|exists:pegawai,id',
            'type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string',
        ]);

        $leave = LeaveRequest::create(array_merge($validated, ['status' => 'pending']));

        return response()->json(['success' => true, 'data' => $leave]);
    }

    public function approve(Request $request, $id)
    {
        $leave = LeaveRequest::findOrFail($id);
        
        $leave->update([
            'status' => 'approved',
            'approved_by' => $request->user() ? $request->user()->id : null,
            'approved_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $leave]);
    }

    public function reject(Request $request, $id)
    {
        $leave = LeaveRequest::findOrFail($id);
        
        $leave->update([
            'status' => 'rejected',
            'approved_by' => $request->user() ? $request->user()->id : null,
            'approved_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $leave]);
    }
}
