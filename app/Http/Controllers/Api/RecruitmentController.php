<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobVacancy;
use App\Models\Candidate;
use Illuminate\Http\Request;

class RecruitmentController extends Controller
{
    public function index()
    {
        $vacancies = JobVacancy::withCount('candidates')->get();
        return response()->json(['success' => true, 'data' => $vacancies]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'type' => 'nullable|string',
            'status' => 'nullable|string',
            'target_hires' => 'nullable|integer',
            'deadline' => 'nullable|date',
        ]);

        $vacancy = JobVacancy::create($validated);
        return response()->json(['success' => true, 'data' => $vacancy]);
    }

    public function show($id)
    {
        $vacancy = JobVacancy::with('candidates')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $vacancy]);
    }

    public function update(Request $request, $id)
    {
        $vacancy = JobVacancy::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'department_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'type' => 'nullable|string',
            'status' => 'nullable|string',
            'target_hires' => 'nullable|integer',
            'deadline' => 'nullable|date',
        ]);

        $vacancy->update($validated);
        return response()->json(['success' => true, 'data' => $vacancy]);
    }

    public function destroy($id)
    {
        $vacancy = JobVacancy::findOrFail($id);
        $vacancy->delete();
        return response()->json(['success' => true, 'message' => 'Lowongan dihapus']);
    }

    public function candidates($id)
    {
        $vacancy = JobVacancy::findOrFail($id);
        return response()->json(['success' => true, 'data' => $vacancy->candidates]);
    }

    public function addCandidate(Request $request, $id)
    {
        $vacancy = JobVacancy::findOrFail($id);
        
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'resume_path' => 'nullable|string',
            'cover_letter_path' => 'nullable|string',
            'portfolio_path' => 'nullable|string',
            'source' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $candidate = $vacancy->candidates()->create(array_merge($validated, ['applied_at' => now()]));
        return response()->json(['success' => true, 'data' => $candidate]);
    }

    public function updateCandidateStage(Request $request, $candidateId)
    {
        $candidate = Candidate::findOrFail($candidateId);
        
        $validated = $request->validate([
            'stage' => 'required|string'
        ]);

        $candidate->update($validated);
        return response()->json(['success' => true, 'data' => $candidate]);
    }

    public function getAssessments($candidateId)
    {
        $candidate = Candidate::with('assessments')->findOrFail($candidateId);
        return response()->json(['success' => true, 'data' => $candidate->assessments]);
    }

    public function storeAssessment(Request $request, $candidateId)
    {
        $candidate = Candidate::findOrFail($candidateId);
        
        $validated = $request->validate([
            'evaluator_name' => 'nullable|string|max:255',
            'stage' => 'required|string|max:255',
            'score' => 'required|integer|min:1|max:10',
            'comments' => 'nullable|string',
            'recommendation' => 'required|string|in:Lanjut,Tidak Lanjut',
        ]);

        $assessment = $candidate->assessments()->create($validated);
        return response()->json(['success' => true, 'data' => $assessment]);
    }
    public function report()
    {
        $totalVacancies = JobVacancy::count();
        $totalCandidates = Candidate::count();
        
        $funnel = Candidate::select('stage', \DB::raw('count(*) as count'))
            ->groupBy('stage')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => [
                'total_vacancies' => $totalVacancies,
                'total_candidates' => $totalCandidates,
                'funnel' => $funnel
            ]
        ]);
    }
    public function status()
    {
        $setting = \App\Models\Setting::where('key', 'recruitment_active')->first();
        $isActive = $setting ? filter_var($setting->value, FILTER_VALIDATE_BOOLEAN) : true;
        
        return response()->json([
            'success' => true,
            'data' => [
                'is_active' => $isActive
            ]
        ]);
    }
}
