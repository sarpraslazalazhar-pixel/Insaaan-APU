<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $query = Pegawai::with(['manager', 'careerHistory', 'familyMembers']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('full_name', 'like', "%{$search}%")
                ->orWhere('employee_id', 'like', "%{$search}%");
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->has('per_page')) {
            $pegawai = $query->paginate($request->per_page);
        } else {
            $pegawai = $query->get();
        }

        return response()->json([
            'success' => true,
            'data' => $pegawai,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|unique:pegawai',
            'full_name' => 'required|string|max:150',
            'join_date' => 'required|date',
            'employment_status' => 'required|in:Tetap,Kontrak,Relawan',
        ]);

        $data = $request->except(['id', 'career_history', 'children', 'documents']);
        foreach (['join_date', 'contract_end_date', 'date_of_birth', 'graduation_date', 'spouse_dob', 'inactive_date'] as $dateField) {
            if (isset($data[$dateField]) && $data[$dateField] === '') {
                $data[$dateField] = null;
            }
        }

        $pegawai = Pegawai::create($data);

        if ($request->has('career_history') && is_array($request->career_history)) {
            foreach ($request->career_history as $index => $history) {
                $pegawai->careerHistory()->create([
                    'urutan' => $index + 1,
                    'jabatan' => $history['jabatan'] ?? '',
                    'departement' => $history['departement'] ?? null,
                    'unit' => $history['unit'] ?? null,
                    'tanggal_mulai' => $history['mulai'] ? Carbon::parse($history['mulai'])->format('Y-m-d') : null,
                    'tanggal_selesai' => $history['selesai'] ? Carbon::parse($history['selesai'])->format('Y-m-d') : null,
                    'keterangan' => $history['keterangan'] ?? null,
                    'is_current' => $history['is_current'] ?? false,
                ]);
            }
        }

        if ($request->has('children') && is_array($request->children)) {
            foreach ($request->children as $index => $child) {
                $pegawai->familyMembers()->create([
                    'tipe' => 'anak',
                    'nama' => $child['nama'] ?? '',
                    'tanggal_lahir' => $child['dob'] ? Carbon::parse($child['dob'])->format('Y-m-d') : null,
                    'urutan_anak' => $index + 1,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil ditambahkan',
            'data' => $pegawai->load(['careerHistory', 'familyMembers']),
        ], 201);
    }

    public function show($id)
    {
        $pegawai = Pegawai::with(['manager', 'careerHistory', 'familyMembers'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $pegawai,
        ]);
    }

    public function update(Request $request, $id)
    {
        $pegawai = Pegawai::findOrFail($id);

        $data = $request->except(['id', 'career_history', 'children', 'documents']);
        foreach (['join_date', 'contract_end_date', 'date_of_birth', 'graduation_date', 'spouse_dob', 'inactive_date'] as $dateField) {
            if (isset($data[$dateField]) && $data[$dateField] === '') {
                $data[$dateField] = null;
            }
        }

        $pegawai->update($data);

        if ($request->has('career_history') && is_array($request->career_history)) {
            $pegawai->careerHistory()->delete();
            foreach ($request->career_history as $index => $history) {
                $pegawai->careerHistory()->create([
                    'urutan' => $index + 1,
                    'jabatan' => $history['jabatan'] ?? '',
                    'departement' => $history['departement'] ?? null,
                    'unit' => $history['unit'] ?? null,
                    'tanggal_mulai' => $history['mulai'] ? Carbon::parse($history['mulai'])->format('Y-m-d') : null,
                    'tanggal_selesai' => $history['selesai'] ? Carbon::parse($history['selesai'])->format('Y-m-d') : null,
                    'keterangan' => $history['keterangan'] ?? null,
                    'is_current' => $history['is_current'] ?? false,
                ]);
            }
        }

        if ($request->has('children') && is_array($request->children)) {
            $pegawai->familyMembers()->where('tipe', 'anak')->delete();
            foreach ($request->children as $index => $child) {
                $pegawai->familyMembers()->create([
                    'tipe' => 'anak',
                    'nama' => $child['nama'] ?? '',
                    'tanggal_lahir' => $child['dob'] ? Carbon::parse($child['dob'])->format('Y-m-d') : null,
                    'urutan_anak' => $index + 1,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diperbarui',
            'data' => $pegawai->load(['careerHistory', 'familyMembers']),
        ]);
    }

    public function destroy($id)
    {
        $pegawai = Pegawai::findOrFail($id);
        $pegawai->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil dihapus',
        ]);
    }
}
