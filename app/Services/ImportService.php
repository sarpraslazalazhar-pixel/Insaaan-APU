<?php

namespace App\Services;

use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class ImportService
{
    public function normalizeRow(array $row): ?array
    {
        if ($this->skipNonDataRow($row)) {
            return null;
        }

        $employeeId = $row[1] ?? null;
        if (! $employeeId) {
            return null;
        }

        $jobLevelRaw = $row[38] ?? null;

        $data = [
            'pegawai' => [
                'employee_id' => $employeeId,
                'full_name' => $row[2] ?? '',
                'current_position' => $row[3] ?? null,
                'departement' => $row[4] ?? null,
                'unit' => $row[5] ?? null,
                'employment_status' => $row[6] ?? 'Tetap',
                'level' => $this->parseLevel($jobLevelRaw),
                'job_level' => $jobLevelRaw,
                'mobile_phone' => $row[9] ?? null,
                'place_of_birth' => $row[10] ?? null,
                'date_of_birth' => $this->normalizeDate($row[11] ?? null),
                'join_date' => $this->normalizeDate($row[13] ?? null) ?? now()->toDateString(),
                'email_kantor' => $row[18] ?? null,
                'nik' => $row[20] ?? null,
                'nik_address' => $row[21] ?? null,
                'residential_address' => $row[22] ?? null,
                'gender' => $this->normalizeGender($row[23] ?? null),
                'marital_status' => $this->normalizeMaritalStatus($row[24] ?? null),
                'education_level' => $this->parseEducationLevel($row[19] ?? null),
                'institution_name' => $row[36] ?? null,
                'institution_place' => $row[37] ?? null,
                'graduation_date' => $this->normalizeDate($row[35] ?? null),
                'is_active' => true,
            ],
            'family' => $this->normalizeFamily($row),
            'career' => $this->normalizeCareerPath($row),
        ];

        if (empty($data['pegawai']['education_level']) && ! empty($data['pegawai']['institution_name'])) {
            $data['pegawai']['education_level'] = 'Lainnya';
        }

        return $data;
    }

    private function skipNonDataRow(array $row): bool
    {
        $empId = $row[1] ?? '';

        return ! preg_match('/^\d{11}$/', (string) $empId);
    }

    public function normalizeDate(?string $raw): ?string
    {
        if (empty($raw)) {
            return null;
        }

        try {
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
                return $raw;
            }

            if (is_numeric($raw)) {
                return Date::excelToDateTimeObject($raw)->format('Y-m-d');
            }

            $clean = trim($raw);
            if (str_contains($clean, '/')) {
                return Carbon::parse($clean)->format('Y-m-d');
            }

            return Carbon::parse($clean)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function normalizeGender(?string $raw): ?string
    {
        if (! $raw) {
            return null;
        }
        $val = strtoupper(trim($raw));
        if (in_array($val, ['L', 'P'])) {
            return $val;
        }
        if (str_starts_with($val, 'LAKI')) {
            return 'L';
        }
        if (str_starts_with($val, 'PEREMPUAN') || str_starts_with($val, 'WANITA')) {
            return 'P';
        }

        return null;
    }

    private function normalizeMaritalStatus(?string $raw): ?string
    {
        if (! $raw) {
            return null;
        }
        $val = ucfirst(strtolower(trim($raw)));
        $allowed = ['Menikah', 'Single', 'Janda', 'Duda'];
        if (in_array($val, $allowed)) {
            return $val;
        }

        if ($val == 'Belum Menikah') {
            return 'Single';
        }

        return null;
    }

    private function parseEducationLevel(?string $raw): ?string
    {
        if (! $raw) {
            return null;
        }

        $raw = trim($raw);
        if (preg_match('/^(S[1-3]|D[1-4]|SMA|SMK|MA|SMP|MTS|SD|SLTA|SLTP)\b/i', $raw, $m)) {
            return strtoupper($m[1]);
        }

        if (stripos($raw, 's1') !== false) return 'S1';
        if (stripos($raw, 's2') !== false) return 'S2';
        if (stripos($raw, 's3') !== false) return 'S3';
        if (stripos($raw, 'd3') !== false) return 'D3';
        if (stripos($raw, 'd4') !== false) return 'D4';

        return 'Lainnya';
    }

    private function parseLevel(?string $raw): ?int
    {
        if (! $raw) {
            return 5;
        }
        $val = strtolower($raw);
        if (str_contains($val, 'direktur utama') || str_contains($val, 'dirut') || ($val === 'direksi')) {
            return 1;
        }
        if (str_contains($val, 'kepala divisi') || str_contains($val, 'kadiv') || str_contains($val, 'direktur')) {
            return 2;
        }
        if (str_contains($val, 'manager') || str_contains($val, 'kepala perwakilan')) {
            return 3;
        }
        if (str_contains($val, 'supervisor') || str_contains($val, 'koordinator') || str_contains($val, 'spv')) {
            return 4;
        }

        return 5;
    }

    private function normalizeFamily(array $row): array
    {
        $family = [];

        if (! empty($row[25])) {
            $family[] = [
                'tipe' => 'pasangan',
                'nama' => $row[25],
                'tanggal_lahir' => $this->normalizeDate($row[26] ?? null),
                'urutan_anak' => null,
            ];
        }

        $childIndex = 1;
        for ($i = 27; $i <= 33; $i += 2) {
            if (! empty($row[$i])) {
                $family[] = [
                    'tipe' => 'anak',
                    'nama' => $row[$i],
                    'tanggal_lahir' => $this->normalizeDate($row[$i + 1] ?? null),
                    'urutan_anak' => $childIndex++,
                ];
            }
        }

        return $family;
    }

    private function normalizeCareerPath(array $row): array
    {
        $career = [];
        $urutan = 1;

        if (! empty($row[39])) {
            $career[] = [
                'urutan' => $urutan++,
                'jabatan' => $row[39],
                'tanggal_mulai' => null,
                'is_current' => false,
            ];
        }

        for ($i = 40; $i <= 62; $i += 2) {
            $title = $row[$i + 1] ?? null;
            if (! empty($title)) {
                $career[] = [
                    'urutan' => $urutan++,
                    'jabatan' => $title,
                    'tanggal_mulai' => $this->normalizeDate($row[$i] ?? null),
                    'is_current' => false,
                ];
            }
        }

        if (count($career) > 0) {
            $career[count($career) - 1]['is_current'] = true;
        }

        return $career;
    }
}
