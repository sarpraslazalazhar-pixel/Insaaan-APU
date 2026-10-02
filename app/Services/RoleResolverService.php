<?php

namespace App\Services;

use App\Models\Role;

class RoleResolverService
{
    protected array $roleCache = [];

    public function __construct()
    {
        $this->loadRoles();
    }

    protected function loadRoles(): void
    {
        $requiredRoles = [
            'super_admin' => 'Super Admin',
            'admin_hr' => 'Admin HR',
            'finance' => 'Finance / Payroll',
            'manager_divisi' => 'Manager Divisi',
            'staf_viewer' => 'Staf Viewer',
        ];

        foreach ($requiredRoles as $name => $displayName) {
            $role = Role::firstOrCreate(
                ['name' => $name],
                ['display_name' => $displayName, 'description' => 'RBAC PRD role for '.$displayName]
            );
            $this->roleCache[$name] = $role->id;
        }
    }

    /**
     * Resolves the appropriate role based on PRD.md criteria
     *
     * @return array{role_name: string, role_id: int, reason: string}
     */
    public function resolve(?string $dept, ?string $unit, ?string $position, ?string $jobLevel): array
    {
        $deptLower = strtolower(trim((string) $dept));
        $unitLower = strtolower(trim((string) $unit));
        $posLower = strtolower(trim((string) $position));
        $levelLower = strtolower(trim((string) $jobLevel));

        // 1. Admin HR (Kelola database karyawan, cuti, koreksi absen, recruitment)
        if (
            str_contains($posLower, 'hrd') ||
            str_contains($posLower, 'sdm') ||
            str_contains($posLower, 'personalia') ||
            str_contains($posLower, 'kepegawaian') ||
            (str_contains($unitLower, 'kelembagaan') && (str_contains($posLower, 'staf') || str_contains($posLower, 'manager')))
        ) {
            return [
                'role_name' => 'admin_hr',
                'role_id' => $this->roleCache['admin_hr'],
                'reason' => 'Unit/Jabatan terdeteksi sebagai Personalia / SDM / Kelembagaan',
            ];
        }

        // 2. Finance / Payroll (Hitung gaji, reimbursement, laporan keuangan)
        if (
            str_contains($deptLower, 'keuangan') ||
            str_contains($unitLower, 'pengeluaran') ||
            str_contains($unitLower, 'penerimaan') ||
            str_contains($unitLower, 'anggaran') ||
            str_contains($unitLower, 'akuntansi') ||
            str_contains($posLower, 'finance') ||
            str_contains($posLower, 'akuntansi') ||
            str_contains($posLower, 'kasir') ||
            str_contains($posLower, 'payroll')
        ) {
            return [
                'role_name' => 'finance',
                'role_id' => $this->roleCache['finance'],
                'reason' => 'Divisi/Unit terdeteksi sebagai Keuangan / Akuntansi / Anggaran',
            ];
        }

        // 3. Manager Divisi / Atasan (Approval cuti, lembur, reimbursement bawahan)
        if (
            in_array($levelLower, ['direktur utama', 'direksi', 'direktur', 'kepala divisi', 'manager', 'koordinator', 'supervisor']) ||
            str_contains($posLower, 'direktur utama') ||
            str_contains($posLower, 'kepala divisi') ||
            str_contains($posLower, 'manager') ||
            str_contains($posLower, 'koordinator') ||
            str_contains($posLower, 'supervisor') ||
            str_contains($posLower, 'direktur') ||
            str_contains($posLower, 'kepala perwakilan') ||
            str_contains($posLower, 'direksi')
        ) {
            return [
                'role_name' => 'manager_divisi',
                'role_id' => $this->roleCache['manager_divisi'],
                'reason' => 'Level kepemimpinan (Direktur Utama/Kadiv/Manager/Koordinator/Supervisor)',
            ];
        }

        // 4. Default Amil: Staf Viewer (Self Service: absen, ajukan cuti/lembur/reimbursement, slip gaji)
        return [
            'role_name' => 'staf_viewer',
            'role_id' => $this->roleCache['staf_viewer'],
            'reason' => 'Staf Amil / Amil Pelaksana / Lapangan (Akses Self-Service)',
        ];
    }
}
