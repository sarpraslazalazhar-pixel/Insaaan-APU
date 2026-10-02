<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\JobVacancy;
use App\Models\ManpowerPlanning;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecruitmentController extends Controller
{
    public function index(Request $request)
    {
        $vacancies = JobVacancy::orderBy('id', 'desc')->get();
        $candidates = Candidate::orderBy('id', 'desc')->get();
        $mpp = ManpowerPlanning::orderBy('id', 'desc')->get();

        return Inertia::render('Rekrutmen/Index', [
            'vacancies' => $vacancies,
            'candidates' => $candidates,
            'mpp' => $mpp,
        ]);
    }

    public function storeVacancy(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:150',
            'type' => 'required|string',
            'target_hires' => 'required|integer|min:1',
            'deadline' => 'required|date',
        ]);

        JobVacancy::create([
            'title' => $request->title,
            'type' => $request->type,
            'status' => 'Terbuka',
            'target_hires' => $request->target_hires,
            'deadline' => $request->deadline,
            'description' => $request->description,
            'requirements' => $request->requirements,
        ]);

        return redirect()->route('rekrutmen.index')->with('success', 'Lowongan baru berhasil diterbitkan.');
    }

    public function updateCandidateStage(Request $request, $id)
    {
        $candidate = Candidate::findOrFail($id);
        $candidate->update([
            'current_stage' => $request->stage,
        ]);

        return redirect()->route('rekrutmen.index')->with('success', 'Tahapan kandidat berhasil diperbarui ke '.$request->stage);
    }

    public function onboardCandidate(Request $request, $id)
    {
        $candidate = Candidate::findOrFail($id);

        $newEmployeeId = 'AMIL-'.str_pad(Pegawai::max('id') + 1, 3, '0', STR_PAD_LEFT);

        $pegawai = Pegawai::create([
            'employee_id' => $newEmployeeId,
            'full_name' => $candidate->name,
            'email' => $candidate->email,
            'mobile_phone_number' => $candidate->phone,
            'current_position' => $candidate->vacancy->title ?? 'Amil Baru',
            'departement' => 'Umum',
            'employment_status' => 'Kontrak',
            'job_level' => 'Staf',
            'gender' => 'L',
            'join_date' => now()->toDateString(),
            'is_active' => true,
        ]);

        $candidate->update(['current_stage' => 'Diterima']);

        return redirect()->route('pegawai.show', $pegawai->id)->with('success', "Kandidat {$candidate->name} berhasil dikonversi menjadi Amil baru dengan ID {$newEmployeeId}!");
    }

    // Portal Karir Publik (Tanpa Autentikasi)
    public function publicIndex()
    {
        $openVacancies = JobVacancy::where('status', 'Terbuka')
            ->where('deadline', '>=', now()->toDateString())
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Rekrutmen/Public', [
            'vacancies' => $openVacancies,
        ]);
    }

    public function applyPublic(Request $request)
    {
        $request->validate([
            'job_vacancy_id' => 'required|exists:job_vacancies,id',
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:150',
            'phone' => 'required|string|max:30',
            'nik' => 'required|string|max:30',
        ]);

        Candidate::create([
            'job_vacancy_id' => $request->job_vacancy_id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'nik' => $request->nik,
            'cover_letter' => $request->cover_letter,
            'current_stage' => 'Pelamar',
        ]);

        return redirect()->route('karir.index')->with('success', 'Lamaran Anda berhasil dikirim!');
    }
}
