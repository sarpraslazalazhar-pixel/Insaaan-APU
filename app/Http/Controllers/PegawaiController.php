<?php

namespace App\Http\Controllers;

use App\Models\EmployeeDocument;
use App\Models\OrgUnit;
use App\Models\Pegawai;
use App\Models\Position;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $query = Pegawai::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhere('current_position', 'like', "%{$search}%");
            });
        }

        if ($request->filled('division')) {
            $query->where('departement', $request->division);
        }

        if ($request->filled('unit')) {
            $query->where('unit', $request->unit);
        }

        if ($request->filled('status')) {
            $query->where('employment_status', $request->status);
        }

        if ($request->filled('job_level')) {
            $query->where('job_level', $request->job_level);
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', (bool) $request->is_active);
        }

        if ($request->quickFilter === 'EXPIRING') {
            $query->whereNotNull('contract_end_date')
                ->where('contract_end_date', '>=', now())
                ->where('contract_end_date', '<=', now()->addDays(30));
        }

        $pegawai = $query->with(['orgUnit', 'position', 'manager'])->orderBy('id', 'desc')->paginate(10)->withQueryString();

        $divisions = Pegawai::whereNotNull('departement')->distinct()->pluck('departement')->filter()->values();
        $units = Pegawai::whereNotNull('unit')->distinct()->pluck('unit')->filter()->values();
        $jobLevels = ['Direktur Utama', 'Kepala Divisi', 'Manager', 'Koordinator', 'Staf', 'Relawan'];
        $orgUnits = OrgUnit::select('id', 'name', 'code')->get();
        $positions = Position::select('id', 'name', 'code', 'org_unit_id')->get();

        return Inertia::render('Pegawai/Index', [
            'pegawai' => $pegawai,
            'filters' => $request->only(['search', 'division', 'unit', 'status', 'job_level', 'gender', 'is_active', 'quickFilter']),
            'divisions' => $divisions,
            'units' => $units,
            'jobLevels' => $jobLevels,
            'orgUnits' => $orgUnits,
            'positions' => $positions,
        ]);
    }

    public function create()
    {
        $orgUnits = OrgUnit::with('positions')->get();
        $positions = Position::all();
        $managers = Pegawai::where('is_active', true)->select('id', 'full_name', 'employee_id')->orderBy('full_name')->get();

        return Inertia::render('Pegawai/Form', [
            'orgUnits' => $orgUnits,
            'positions' => $positions,
            'managers' => $managers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|unique:pegawai,employee_id',
            'full_name' => 'required|string|max:150',
            'join_date' => 'required|date',
            'employment_status' => 'required|in:Tetap,Kontrak,Relawan',
        ]);

        $data = $request->except(['id', 'career_history', 'children', 'documents']);
        foreach (['join_date', 'contract_end_date', 'date_of_birth', 'spouse_dob'] as $dateField) {
            if (isset($data[$dateField]) && $data[$dateField] === '') {
                $data[$dateField] = null;
            }
        }

        $pegawai = Pegawai::create($data);

        if ($request->has('children') && is_array($request->children)) {
            foreach ($request->children as $index => $child) {
                if (! empty($child['nama'])) {
                    $pegawai->familyMembers()->create([
                        'tipe' => 'anak',
                        'nama' => $child['nama'],
                        'tanggal_lahir' => ! empty($child['dob']) ? Carbon::parse($child['dob'])->format('Y-m-d') : null,
                        'urutan_anak' => $index + 1,
                    ]);
                }
            }
        }

        return redirect()->route('pegawai.index')->with('success', 'Amil baru '.$pegawai->full_name.' berhasil didaftarkan.');
    }

    public function show($id)
    {
        if (! Schema::hasTable('employee_documents')) {
            Schema::create('employee_documents', function ($table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('pegawai')->cascadeOnDelete();
                $table->string('document_type', 100);
                $table->string('file_path');
                $table->string('original_name')->nullable();
                $table->integer('file_size')->nullable();
                $table->timestamp('uploaded_at')->useCurrent();
                $table->timestamps();
            });
        }

        $pegawai = Pegawai::with([
            'familyMembers',
            'careerHistory' => function ($q) {
                $q->orderBy('urutan', 'asc')->orderBy('id', 'asc');
            },
            'documents' => function ($q) {
                $q->orderBy('id', 'desc');
            },
            'orgUnit',
            'position',
            'manager',
        ])->findOrFail($id);

        return Inertia::render('Pegawai/Show', [
            'pegawai' => $pegawai,
        ]);
    }

    public function edit($id)
    {
        $pegawai = Pegawai::with(['familyMembers', 'careerHistory'])->findOrFail($id);
        $orgUnits = OrgUnit::with('positions')->get();
        $positions = Position::all();
        $managers = Pegawai::where('is_active', true)->where('id', '!=', $id)->select('id', 'full_name', 'employee_id')->orderBy('full_name')->get();

        return Inertia::render('Pegawai/Form', [
            'pegawai' => $pegawai,
            'isEdit' => true,
            'orgUnits' => $orgUnits,
            'positions' => $positions,
            'managers' => $managers,
        ]);
    }

    public function update(Request $request, $id)
    {
        $pegawai = Pegawai::findOrFail($id);

        $request->validate([
            'full_name' => 'required|string|max:150',
            'employment_status' => 'required|in:Tetap,Kontrak,Relawan',
        ]);

        $data = $request->except(['id', 'employee_id', 'career_history', 'children', 'documents']);
        foreach (['join_date', 'contract_end_date', 'date_of_birth', 'spouse_dob'] as $dateField) {
            if (isset($data[$dateField]) && $data[$dateField] === '') {
                $data[$dateField] = null;
            }
        }

        $pegawai->update($data);

        if ($request->has('children') && is_array($request->children)) {
            $pegawai->familyMembers()->delete();
            foreach ($request->children as $index => $child) {
                if (! empty($child['nama'])) {
                    $pegawai->familyMembers()->create([
                        'tipe' => 'anak',
                        'nama' => $child['nama'],
                        'tanggal_lahir' => ! empty($child['dob']) ? Carbon::parse($child['dob'])->format('Y-m-d') : null,
                        'urutan_anak' => $index + 1,
                    ]);
                }
            }
        }

        return redirect()->route('pegawai.show', $pegawai->id)->with('success', 'Data amil berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $pegawai = Pegawai::findOrFail($id);
        $pegawai->update(['is_active' => false]);

        return redirect()->route('pegawai.index')->with('success', 'Karyawan '.$pegawai->full_name.' berhasil dinonaktifkan.');
    }

    public function uploadDocument(Request $request, $id)
    {
        if (! Schema::hasTable('employee_documents')) {
            Schema::create('employee_documents', function ($table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('pegawai')->cascadeOnDelete();
                $table->string('document_type', 100);
                $table->string('file_path');
                $table->string('original_name')->nullable();
                $table->integer('file_size')->nullable();
                $table->timestamp('uploaded_at')->useCurrent();
                $table->timestamps();
            });
        }

        $pegawai = Pegawai::findOrFail($id);

        $request->validate([
            'document_type' => 'required|string|max:100',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // Maks 5 MB sesuai PRD HR-03
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $storedPath = $file->store('documents/'.$pegawai->employee_id, 'public');

        $pegawai->documents()->create([
            'document_type' => $request->document_type,
            'file_path' => $storedPath,
            'original_name' => $originalName,
            'file_size' => $fileSize,
            'uploaded_at' => now(),
        ]);

        return redirect()->route('pegawai.show', $pegawai->id)->with('success', 'Dokumen '.$request->document_type.' berhasil diunggah.');
    }

    public function deleteDocument($docId)
    {
        $doc = EmployeeDocument::findOrFail($docId);
        $empId = $doc->employee_id;

        if (Storage::disk('public')->exists($doc->file_path)) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $doc->delete();

        return redirect()->route('pegawai.show', $empId)->with('success', 'Dokumen berhasil dihapus.');
    }
}
