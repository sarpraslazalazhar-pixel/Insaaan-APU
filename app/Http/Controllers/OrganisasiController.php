<?php

namespace App\Http\Controllers;

use App\Models\OrgUnit;
use App\Models\Pegawai;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class OrganisasiController extends Controller
{
    public function index(Request $request)
    {
        if ($request->has('reset')) {
            return $this->resetAll();
        }

        // Auto-normalize any Koordinator or Supervisor positions to level 4
        Position::where(function ($q) {
            $q->where('name', 'like', '%koordinator%')
              ->orWhere('name', 'like', '%supervisor%')
              ->orWhere('name', 'like', '%spv%');
        })->where('level', '!=', 4)->update(['level' => 4]);

        Pegawai::where(function ($q) {
            $q->where('current_position', 'like', '%koordinator%')
              ->orWhere('current_position', 'like', '%supervisor%');
        })->where('level', '!=', 4)->update(['level' => 4]);

        // 1. Master Units with child hierarchy, positions, and active employees
        $units = OrgUnit::with([
            'parent',
            'children',
            'positions',
            'employees' => function ($q) {
                $q->where('is_active', true)->select('id', 'employee_id', 'full_name', 'current_position', 'unit_id', 'position_id', 'manager_id', 'job_level', 'is_field_staff');
            },
        ])
            ->withCount('employees')
            ->get();

        // 2. Positions with Unit relation and employee count
        $positions = Position::with(['unit'])
            ->withCount('employees')
            ->orderBy('level')
            ->get();

        // 3. Management Tree: Employees who have manager_id or are managers
        $allPegawai = Pegawai::where('is_active', true)
            ->with(['orgUnit', 'position', 'manager'])
            ->select('id', 'employee_id', 'full_name', 'current_position', 'unit_id', 'position_id', 'manager_id', 'job_level', 'is_field_staff')
            ->get();

        // Build leadership roots (no manager_id or level 1/2)
        $leaders = $allPegawai->whereNull('manager_id')->values();

        // Format employee count summary
        $totalAmil = Pegawai::where('is_active', true)->count();
        $totalFieldAmil = Pegawai::where('is_active', true)->where('is_field_staff', true)->count();
        $totalFormalUnits = $units->where('type', 'formal')->count();
        $totalAdhocUnits = $units->whereIn('type', ['ad_hoc', 'rintisan'])->count();

        return Inertia::render('Organisasi/Index', [
            'units' => $units,
            'positions' => $positions,
            'allPegawai' => $allPegawai,
            'leaders' => $leaders,
            'summary' => [
                'totalUnits' => $units->count(),
                'totalFormalUnits' => $totalFormalUnits,
                'totalAdhocUnits' => $totalAdhocUnits,
                'totalPositions' => $positions->count(),
                'totalAmil' => $totalAmil,
                'totalFieldAmil' => $totalFieldAmil,
            ],
        ]);
    }

    public function storeUnit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:50|unique:org_units,code',
            'type' => 'required|in:formal,ad_hoc,rintisan',
            'is_official' => 'nullable|boolean',
            'parent_id' => 'nullable|exists:org_units,id',
        ]);

        $validated['is_official'] = $request->boolean('is_official');

        OrgUnit::create($validated);

        return redirect()->route('organisasi.index')->with('success', 'Unit/Divisi '.$validated['name'].' berhasil ditambahkan.');
    }

    public function storePosition(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:50|unique:positions,code',
            'org_unit_id' => 'nullable|exists:org_units,id',
            'level' => 'nullable|integer|min:1|max:5',
        ]);

        Position::create($validated);

        return redirect()->route('organisasi.index')->with('success', 'Jabatan '.$validated['name'].' berhasil ditambahkan.');
    }

    public function updatePosition(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:50',
            'org_unit_id' => 'nullable|exists:org_units,id',
            'level' => 'required|integer|min:1|max:5',
        ]);

        $pos = Position::findOrFail($id);
        $pos->update($validated);
        Pegawai::where('position_id', $id)->update(['level' => $validated['level']]);

        return redirect()->route('organisasi.index')->with('success', 'Jabatan '.$pos->name.' berhasil diperbarui.');
    }

    public function destroyUnit($id)
    {
        $unit = OrgUnit::findOrFail($id);
        OrgUnit::where('parent_id', $id)->update(['parent_id' => null]);
        Pegawai::where('unit_id', $id)->update(['unit_id' => null]);
        Position::where('org_unit_id', $id)->update(['org_unit_id' => null]);
        $unit->delete();

        return redirect()->route('organisasi.index')->with('success', 'Unit '.$unit->name.' berhasil dihapus.');
    }

    public function destroyPosition($id)
    {
        $pos = Position::findOrFail($id);
        Pegawai::where('position_id', $id)->update(['position_id' => null]);
        $pos->delete();

        return redirect()->route('organisasi.index')->with('success', 'Jabatan '.$pos->name.' berhasil dihapus.');
    }

    public function seedDefault()
    {
        $seeder = new \Database\Seeders\OrgStructureSeeder();
        $seeder->run();

        return redirect()->route('organisasi.index')->with('success', 'Struktur organisasi LAZ Al Azhar (Sekretariat, Keuangan, Fundraising & KPw, Program, Wakaf) berhasil diterapkan.');
    }

    public function resetAll()
    {
        Schema::disableForeignKeyConstraints();
        Pegawai::query()->update(['unit_id' => null, 'position_id' => null]);
        Position::truncate();
        OrgUnit::truncate();
        Schema::enableForeignKeyConstraints();

        return redirect()->route('organisasi.index')->with('success', 'Seluruh data struktur organisasi (unit & jabatan) berhasil dikosongkan. Silakan mulai input struktur baru.');
    }
}
