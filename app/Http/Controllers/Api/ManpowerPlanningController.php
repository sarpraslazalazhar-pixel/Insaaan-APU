<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManpowerPlanning;
use Illuminate\Http\Request;

class ManpowerPlanningController extends Controller
{
    public function index()
    {
        $mpp = ManpowerPlanning::orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $mpp]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'period' => 'required|string|max:100',
            'department_id' => 'nullable|integer',
            'position_name' => 'required|string|max:255',
            'headcount' => 'required|integer|min:1',
            'reason' => 'required|string|max:255',
            'status' => 'required|string|in:Draft,Disetujui,Terealisasi',
        ]);

        $mpp = ManpowerPlanning::create($validated);
        return response()->json(['success' => true, 'data' => $mpp]);
    }

    public function update(Request $request, $id)
    {
        $mpp = ManpowerPlanning::findOrFail($id);
        
        $validated = $request->validate([
            'period' => 'required|string|max:100',
            'department_id' => 'nullable|integer',
            'position_name' => 'required|string|max:255',
            'headcount' => 'required|integer|min:1',
            'reason' => 'required|string|max:255',
            'status' => 'required|string|in:Draft,Disetujui,Terealisasi',
        ]);

        $mpp->update($validated);
        return response()->json(['success' => true, 'data' => $mpp]);
    }

    public function destroy($id)
    {
        $mpp = ManpowerPlanning::findOrFail($id);
        $mpp->delete();
        return response()->json(['success' => true, 'message' => 'Manpower Planning dihapus']);
    }
}
