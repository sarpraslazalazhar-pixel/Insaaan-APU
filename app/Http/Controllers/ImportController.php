<?php

namespace App\Http\Controllers;

use App\Imports\PegawaiImport;
use App\Models\ImportLog;
use App\Models\OrgUnit;
use App\Models\Pegawai;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use App\Services\RoleResolverService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class ImportController extends Controller
{
    public function index()
    {
        $logs = ImportLog::orderBy('id', 'desc')->take(10)->get();

        return Inertia::render('Import/Index', [
            'logs' => $logs,
            'preview' => session('import_preview'),
            'roleSummary' => session('import_role_summary'),
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['csv', 'xlsx', 'xls'])) {
            return back()->withErrors(['file' => 'Format file harus .csv, .xlsx, atau .xls']);
        }

        $path = 'temp/'.$file->hashName();
        Storage::put($path, file_get_contents($file->getPathname()));
        $fullPath = Storage::path($path);

        try {
            $data = Excel::toArray(new PegawaiImport, $fullPath);
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            if (empty($data) || empty($data[0])) {
                return back()->withErrors(['file' => 'File kosong atau tidak terbaca.']);
            }

            $rows = $data[0];
            $previewRows = array_slice($rows, 0, 6);

            return redirect()->route('import.index')->with('import_preview', [
                'total_rows' => max(0, count($rows) - 1),
                'preview' => $previewRows,
            ]);
        } catch (\Exception $e) {
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return back()->withErrors(['file' => 'Gagal membaca pratinjau: '.$e->getMessage()]);
        }
    }

    public function import(Request $request, RoleResolverService $roleResolver)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['csv', 'xlsx', 'xls'])) {
            return back()->withErrors(['file' => 'Format file harus .csv, .xlsx, atau .xls']);
        }

        $path = 'temp/'.$file->hashName();
        Storage::put($path, file_get_contents($file->getPathname()));
        $fullPath = Storage::path($path);

        try {
            $data = Excel::toArray(new PegawaiImport, $fullPath);
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            if (empty($data) || empty($data[0])) {
                return back()->withErrors(['file' => 'File kosong']);
            }

            $rows = $data[0];
            if (count($rows) <= 1) {
                return back()->withErrors(['file' => 'File hanya berisi header tanpa baris data amil.']);
            }

            // 1. Build Header Index Map
            $headerRow = $rows[0];
            $colMap = [];
            foreach ($headerRow as $idx => $headerText) {
                if (! is_string($headerText)) {
                    continue;
                }
                $clean = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $headerText)));
                if ($clean !== '') {
                    $colMap[$clean] = $idx;
                }
            }

            // Helper to get row value using aliases or fallback index
            $getVal = function ($row, $keys, $fallbackIdx = null) use ($colMap) {
                foreach ((array) $keys as $k) {
                    $clean = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $k)));
                    if (isset($colMap[$clean]) && isset($row[$colMap[$clean]])) {
                        $val = trim((string) $row[$colMap[$clean]]);
                        if ($val !== '') {
                            return $val;
                        }
                    }
                }
                if ($fallbackIdx !== null && isset($row[$fallbackIdx])) {
                    $val = trim((string) $row[$fallbackIdx]);
                    if ($val !== '') {
                        return $val;
                    }
                }

                return null;
            };

            // Date parsing helper
            $parseDate = function ($raw) {
                if (empty($raw)) {
                    return null;
                }
                $raw = trim((string) $raw);
                if ($raw === '' || $raw === '-' || strtolower($raw) === 'null') {
                    return null;
                }
                if (is_numeric($raw)) {
                    try {
                        return ExcelDate::excelToDateTimeObject((float) $raw)->format('Y-m-d');
                    } catch (\Throwable $e) {
                    }
                }

                // Standard date formats with 4-digit and 2-digit years
                $formats = [
                    'Y-m-d', 'd/m/Y', 'm/d/Y', 'd-m-Y', 'm-d-Y',
                    'd/m/y', 'm/d/y', 'd-m-y', 'm-d-y',
                    'j/n/Y', 'n/j/Y', 'j/n/y', 'n/j/y',
                    'd M Y', 'j M Y', 'd F Y', 'j F Y',
                ];
                foreach ($formats as $fmt) {
                    try {
                        $d = Carbon::createFromFormat($fmt, $raw);
                        if ($d !== false && $d->year >= 1950 && $d->year <= 2099) {
                            return $d->format('Y-m-d');
                        }
                    } catch (\Throwable $e) {
                    }
                }

                // Handle Indonesian month names like "4 Apr 1980", "13 Sept 1999", "11 Mei 25"
                try {
                    $indoMonths = [
                        'jan' => 'Jan', 'feb' => 'Feb', 'mar' => 'Mar', 'apr' => 'Apr',
                        'mei' => 'May', 'jun' => 'Jun', 'jul' => 'Jul', 'agu' => 'Aug',
                        'agt' => 'Aug', 'sep' => 'Sep', 'sept' => 'Sep', 'okt' => 'Oct',
                        'nov' => 'Nov', 'des' => 'Dec',
                    ];
                    $engRaw = str_ireplace(array_keys($indoMonths), array_values($indoMonths), $raw);

                    return Carbon::parse($engRaw)->format('Y-m-d');
                } catch (\Throwable $e) {
                    return null;
                }
            };

            // Pre-load all OrgUnits and Positions
            $allUnits = OrgUnit::all();
            $allPositions = Position::all();

            $resolveUnit = function ($unitName, $deptName) use ($allUnits) {
                $cleanUnit = trim((string) $unitName);
                $cleanDept = trim((string) $deptName);

                // 1. Check unit name if not 'Direksi'
                if ($cleanUnit !== '' && strcasecmp($cleanUnit, 'direksi') !== 0) {
                    $found = $allUnits->first(function ($u) use ($cleanUnit) {
                        return strcasecmp($u->name, $cleanUnit) === 0 || strcasecmp($u->code ?? '', $cleanUnit) === 0;
                    });
                    if ($found) {
                        return $found;
                    }

                    $foundPartial = $allUnits->first(function ($u) use ($cleanUnit) {
                        return str_contains(strtolower($u->name), strtolower($cleanUnit)) ||
                               str_contains(strtolower($cleanUnit), strtolower($u->name));
                    });
                    if ($foundPartial) {
                        return $foundPartial;
                    }
                }

                // 2. Check department/division name
                if ($cleanDept !== '') {
                    $found = $allUnits->first(function ($u) use ($cleanDept) {
                        return strcasecmp($u->name, $cleanDept) === 0 || strcasecmp($u->code ?? '', $cleanDept) === 0;
                    });
                    if ($found) {
                        return $found;
                    }
                }

                // 3. Fallback to root holding
                return $allUnits->firstWhere('parent_id', null) ?? $allUnits->first();
            };

            $resolvePosition = function ($posName, $unitId, $jobLevel) use (&$allPositions) {
                $cleanPos = trim((string) $posName);
                if ($cleanPos === '') {
                    $cleanPos = 'Staf Amil';
                }

                // Try match position in unit
                $found = $allPositions->first(function ($p) use ($cleanPos, $unitId) {
                    return strcasecmp($p->name, $cleanPos) === 0 && ($unitId ? $p->org_unit_id === $unitId : true);
                });
                if ($found) {
                    return $found;
                }

                // Try match position globally
                $foundGlobal = $allPositions->first(function ($p) use ($cleanPos) {
                    return strcasecmp($p->name, $cleanPos) === 0;
                });
                if ($foundGlobal) {
                    return $foundGlobal;
                }

                // Determine hierarchy level
                $level = 5;
                $lvlLower = strtolower((string) $jobLevel);
                $posLower = strtolower($cleanPos);

                // Level 1: Direktur Utama
                if (
                    str_contains($lvlLower, 'direktur utama') || str_contains($posLower, 'direktur utama') ||
                    str_contains($lvlLower, 'dirut') || str_contains($posLower, 'dirut') ||
                    ($lvlLower === 'direksi' && ! str_contains($posLower, 'divisi') && ! str_contains($posLower, 'operasional') && ! str_contains($posLower, 'keuangan') && ! str_contains($posLower, 'laz'))
                ) {
                    $level = 1;
                }
                // Level 2: Kepala Divisi / Direktur Bidang
                elseif (
                    str_contains($lvlLower, 'kepala divisi') || str_contains($posLower, 'kepala divisi') ||
                    str_contains($posLower, 'kadiv') || str_contains($posLower, 'direktur operasional') ||
                    str_contains($posLower, 'direktur keuangan') || str_contains($posLower, 'direktur laz')
                ) {
                    $level = 2;
                }
                // Level 3: Manager / Kepala KPw
                elseif (
                    str_contains($lvlLower, 'manager') || str_contains($posLower, 'manager') ||
                    str_contains($posLower, 'kepala perwakilan') || str_contains($posLower, 'kepala kpw')
                ) {
                    $level = 3;
                }
                // Level 4: Supervisor / Koordinator
                elseif (
                    str_contains($lvlLower, 'supervisor') || str_contains($posLower, 'supervisor') ||
                    str_contains($lvlLower, 'koordinator') || str_contains($posLower, 'koordinator') ||
                    str_contains($posLower, 'spv')
                ) {
                    $level = 4;
                } else {
                    $level = 5; // Staf Amil / Non Staf / Relawan
                }

                $newPos = Position::create([
                    'name' => $cleanPos,
                    'code' => 'POS_'.strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $cleanPos), 0, 15)).'_'.rand(100, 999),
                    'org_unit_id' => $unitId,
                    'level' => $level,
                ]);
                $allPositions->push($newPos);

                return $newPos;
            };

            $success = 0;
            $failed = 0;
            $roleStats = [
                'admin_hr' => 0,
                'finance' => 0,
                'manager_divisi' => 0,
                'staf_viewer' => 0,
            ];

            // 2. Iterate each row (skip header)
            foreach (array_slice($rows, 1) as $row) {
                $employeeId = $getVal($row, ['employeeid', 'nip', 'nikkaryawan', 'idkaryawan', 'nopegawai'], 1);
                $fullName = $getVal($row, ['fullname', 'nama', 'namalengkap', 'namakaryawan'], 2);

                if (empty($employeeId) && empty($fullName)) {
                    continue;
                }

                if (empty($employeeId)) {
                    $employeeId = 'AMIL-'.str_pad($success + 1, 4, '0', STR_PAD_LEFT);
                }

                $currentPos = $getVal($row, ['currentposition', 'jabatan', 'posisi'], 3) ?? 'Staf Amil';
                $departement = $getVal($row, ['departement', 'department', 'divisi', 'departemen'], 4) ?? 'Sekretariat';
                $unitName = $getVal($row, ['unit', 'unitkerja', 'bagian'], 5);
                $empStatus = $getVal($row, ['employmentstatus', 'statuskepegawaian', 'status'], 6);
                $rawJobLevel = $getVal($row, ['joblevel', 'level', 'eselon'], 38) ?? 'Staf';
                $jobLevel = 'Staf';
                $jlLower = strtolower($rawJobLevel);
                if (str_contains($jlLower, 'direktur utama') || str_contains($jlLower, 'dirut') || $jlLower === 'direksi') {
                    $jobLevel = 'Direktur Utama';
                } elseif (str_contains($jlLower, 'kepala divisi') || str_contains($jlLower, 'kadiv')) {
                    $jobLevel = 'Kepala Divisi';
                } elseif (str_contains($jlLower, 'manager')) {
                    $jobLevel = 'Manager';
                } elseif (str_contains($jlLower, 'supervisor') || str_contains($jlLower, 'koordinator') || str_contains($jlLower, 'spv')) {
                    $jobLevel = 'Koordinator';
                } elseif (str_contains($jlLower, 'relawan')) {
                    $jobLevel = 'Relawan';
                } else {
                    $jobLevel = 'Staf';
                }

                $statusAktif = $getVal($row, ['statusaktifnonaktif', 'status', 'isactive'], 8);
                $phone = $getVal($row, [
                    'mobilephonenumber', 'mobilephone', 'nomorhandphone', 'nohandphone',
                    'nomorhp', 'nohp', 'telepon', 'nomortelepon', 'handphone', 'phone',
                    'phonenumber', 'hp', 'kontak', 'notelp',
                ], 9);
                $pob = $getVal($row, ['placeofbirth', 'tempatlahir'], 10);
                $dob = $parseDate($getVal($row, ['dateofbirth', 'tanggallahir'], 11));
                $joinDate = $parseDate($getVal($row, ['joindate', 'tanggalmasuk', 'tglmasuk'], 13)) ?? now()->toDateString();
                $email = $getVal($row, [
                    'email', 'emailkantor', 'emailpribadi', 'alamatemail', 'surel', 'mail',
                    'emailaddress', 'useremail',
                ], 18);
                $nik = $getVal($row, ['citizenid', 'nik', 'ktp'], 20);
                $nikAddress = $getVal($row, [
                    'citizenidaddress', 'alamatktp', 'alamatsesuaiktp', 'alamatidentitas',
                    'alamatnik', 'alamatkartutandapenduduk', 'alamatktpdomisili', 'alamat',
                ], 21);
                $residentialAddress = $getVal($row, [
                    'residentialaddress', 'alamatdomisili', 'alamattempattinggal', 'domisili',
                    'alamattinggal', 'alamatrumah', 'alamatsekarang',
                ], 22);
                $genderRaw = strtoupper((string) $getVal($row, ['gender', 'jeniskelamin', 'jk'], 23));
                $gender = str_starts_with($genderRaw, 'P') ? 'P' : 'L';
                $maritalStatus = $getVal($row, ['maritalstatus', 'statuspernikahan'], 24);
                $spouseName = $getVal($row, ['spouse', 'pasangan', 'namapasangan'], 25);
                $spouseDob = $parseDate($getVal($row, ['dateofbirthspouse', 'tanggallahirpasangan'], 26));

                // Education Fields
                $educationRaw = $getVal($row, ['education', 'pendidikan', 'pendidikanterakhir'], 19);
                $educationLevel = null;
                if ($educationRaw) {
                    if (preg_match('/^(S[1-3]|D[1-4]|SMA|SMK|MA|SMP|MTS|SD|SLTA|SLTP)\b/i', trim($educationRaw), $m)) {
                        $educationLevel = strtoupper($m[1]);
                    } elseif (stripos($educationRaw, 's1') !== false) {
                        $educationLevel = 'S1';
                    } elseif (stripos($educationRaw, 's2') !== false) {
                        $educationLevel = 'S2';
                    } elseif (stripos($educationRaw, 's3') !== false) {
                        $educationLevel = 'S3';
                    } elseif (stripos($educationRaw, 'd3') !== false) {
                        $educationLevel = 'D3';
                    } elseif (stripos($educationRaw, 'd4') !== false) {
                        $educationLevel = 'D4';
                    } elseif (stripos($educationRaw, 'slta') !== false || stripos($educationRaw, 'sma') !== false || stripos($educationRaw, 'smk') !== false) {
                        $educationLevel = 'SLTA';
                    } elseif (stripos($educationRaw, 'sltp') !== false || stripos($educationRaw, 'smp') !== false) {
                        $educationLevel = 'SLTP';
                    } else {
                        $educationLevel = 'Lainnya';
                    }
                }

                $institutionName = $getVal($row, ['educationalinstitution', 'institusipendidikan', 'namasekolah', 'universitas', 'institusi', 'namakampus'], 36);
                $institutionPlace = $getVal($row, ['institutionplace', 'tempatinstitusi', 'lokasisekolah', 'kota', 'tempatkuliah'], 37);
                $graduationDate = $parseDate($getVal($row, ['graduationdate', 'tanggallulus', 'tahunlulus'], 35));

                // Normalize Employment Status
                $statusNormalized = 'Tetap';
                if ($empStatus) {
                    if (stripos($empStatus, 'kontrak') !== false) {
                        $statusNormalized = 'Kontrak';
                    } elseif (stripos($empStatus, 'relawan') !== false) {
                        $statusNormalized = 'Relawan';
                    }
                }

                // Check Active Status
                $isActive = true;
                if ($statusAktif && (stripos($statusAktif, 'non') !== false || stripos($statusAktif, 'keluar') !== false)) {
                    $isActive = false;
                }

                // 3. Resolve Unit & Position
                $matchedUnit = $resolveUnit($unitName, $departement);
                $unitId = $matchedUnit ? $matchedUnit->id : null;

                // Field staff detection
                $isFieldStaff = false;
                if (
                    ($matchedUnit && str_contains(strtolower($matchedUnit->name), 'kpw')) ||
                    ($unitName && stripos($unitName, 'kpw') !== false) ||
                    stripos($currentPos, 'lapangan') !== false ||
                    stripos($currentPos, 'fundraiser') !== false ||
                    stripos($currentPos, 'surveyor') !== false
                ) {
                    $isFieldStaff = true;
                }

                $matchedPosition = $resolvePosition($currentPos, $unitId, $jobLevel);
                $positionId = $matchedPosition ? $matchedPosition->id : null;

                // 4. Save/Update Pegawai
                $pegawai = Pegawai::updateOrCreate(
                    ['employee_id' => $employeeId],
                    [
                        'full_name' => $fullName,
                        'current_position' => $currentPos,
                        'departement' => $departement,
                        'unit' => $unitName ?? $departement,
                        'unit_id' => $unitId,
                        'position_id' => $positionId,
                        'employment_status' => $statusNormalized,
                        'level' => $matchedPosition ? $matchedPosition->level : $level,
                        'job_level' => $jobLevel,
                        'gender' => $gender,
                        'education_level' => $educationLevel,
                        'institution_name' => $institutionName,
                        'institution_place' => $institutionPlace,
                        'graduation_date' => $graduationDate,
                        'email_kantor' => $email,
                        'email_pribadi' => $email,
                        'mobile_phone' => $phone,
                        'place_of_birth' => $pob,
                        'date_of_birth' => $dob,
                        'join_date' => $joinDate,
                        'nik' => $nik,
                        'nik_address' => $nikAddress,
                        'residential_address' => $residentialAddress ?: $nikAddress,
                        'marital_status' => in_array($maritalStatus, ['Menikah', 'Single', 'Janda', 'Duda']) ? $maritalStatus : ($spouseName ? 'Menikah' : 'Single'),
                        'spouse_name' => $spouseName,
                        'spouse_dob' => $spouseDob,
                        'is_active' => $isActive,
                        'is_field_staff' => $isFieldStaff,
                    ]
                );

                // 5. Save Family Members (Children) if present in row
                $childCols = [
                    ['name' => $getVal($row, ['childname1', 'anak1'], 27), 'dob' => $parseDate($getVal($row, ['childdob1', 'tglanak1'], 28))],
                    ['name' => $getVal($row, ['childname2', 'anak2'], 29), 'dob' => $parseDate($getVal($row, ['childdob2', 'tglanak2'], 30))],
                    ['name' => $getVal($row, ['childname3', 'anak3'], 31), 'dob' => $parseDate($getVal($row, ['childdob3', 'tglanak3'], 32))],
                    ['name' => $getVal($row, ['childname4', 'anak4'], 33), 'dob' => $parseDate($getVal($row, ['childdob4', 'tglanak4'], 34))],
                ];

                foreach ($childCols as $order => $child) {
                    if (! empty($child['name'])) {
                        $pegawai->familyMembers()->updateOrCreate(
                            ['urutan_anak' => $order + 1],
                            [
                                'tipe' => 'anak',
                                'nama' => trim($child['name']),
                                'tanggal_lahir' => $child['dob'],
                            ]
                        );
                    }
                }

                // 5b. Save Career History & Mutation Milestones (Riwayat Jabatan & Mutasi)
                $careerRawList = [];

                // Helper to deduce department and unit from title if applicable
                $detectDeptUnit = function ($jobTitle, $defaultDept, $defaultUnit, $isCurrent) {
                    if ($isCurrent) {
                        return [$defaultDept, $defaultUnit];
                    }
                    $t = strtolower((string) $jobTitle);
                    $dept = null;
                    $unit = null;

                    if (str_contains($t, 'kpw') || str_contains($t, 'perwakilan')) {
                        $dept = 'Fundraising & Partnership';
                        if (str_contains($t, 'jateng') || str_contains($t, 'jawa tengah')) {
                            $unit = 'KPw Jateng';
                        } elseif (str_contains($t, 'jatim') || str_contains($t, 'jawa timur')) {
                            $unit = 'KPw Jatim';
                        } elseif (str_contains($t, 'sulsel') || str_contains($t, 'sulawesi')) {
                            $unit = 'KPw Sulsel';
                        } elseif (str_contains($t, 'sumut') || str_contains($t, 'sumatera')) {
                            $unit = 'KPw Sumut';
                        } elseif (str_contains($t, 'yogya') || str_contains($t, 'jogja')) {
                            $unit = 'KPw Yogyakarta';
                        }
                    } elseif (str_contains($t, 'fundraising') || str_contains($t, 'funding') || str_contains($t, 'fundkompart') || str_contains($t, 'komunitas') || str_contains($t, 'corporate')) {
                        $dept = 'Fundraising & Partnership';
                    } elseif (str_contains($t, 'program') || str_contains($t, 'pendayagunaan') || str_contains($t, 'mustahik') || str_contains($t, 'infralink') || str_contains($t, 'pemberdayaan') || str_contains($t, 'ekonomi') || str_contains($t, 'charity') || str_contains($t, 'surveyor')) {
                        $dept = 'Program';
                    } elseif (str_contains($t, 'keuangan') || str_contains($t, 'akuntansi') || str_contains($t, 'anggaran') || str_contains($t, 'kasir') || str_contains($t, 'pengeluaran') || str_contains($t, 'penerimaan')) {
                        $dept = 'Keuangan';
                    } elseif (str_contains($t, 'wakaf')) {
                        $dept = 'Wakaf';
                    } elseif (str_contains($t, 'kelembagaan') || str_contains($t, 'sekretariat') || str_contains($t, 'diklat') || str_contains($t, 'litbang') || str_contains($t, 'humas') || str_contains($t, 'it ') || str_contains($t, 'ga ') || str_contains($t, 'general affair') || str_contains($t, 'legal') || str_contains($t, 'audio visual') || str_contains($t, 'desain')) {
                        $dept = 'Sekretariat';
                        if (str_contains($t, 'diklat') || str_contains($t, 'litbang')) {
                            $unit = 'Diklat & Litbang';
                        } elseif (str_contains($t, 'kelembagaan') || str_contains($t, 'hrd') || str_contains($t, 'sdm') || str_contains($t, 'legal')) {
                            $unit = 'Kelembagaan';
                        } elseif (str_contains($t, 'it') || str_contains($t, 'ga') || str_contains($t, 'humas') || str_contains($t, 'komunikasi') || str_contains($t, 'desain')) {
                            $unit = 'Humas, GA, dan IT';
                        }
                    }

                    return [$dept, $unit];
                };

                // 1. Initial Position (Career Start at column 39)
                $startIdx = $colMap['careerstart'] ?? $colMap['karirawal'] ?? $colMap['posisiawal'] ?? 39;
                if ($startIdx !== null && isset($row[$startIdx])) {
                    $startTitle = trim((string) $row[$startIdx]);
                    if ($startTitle !== '' && ! is_numeric($startTitle) && strcasecmp($startTitle, 'null') !== 0) {
                        $careerRawList[] = [
                            'jabatan' => $startTitle,
                            'tanggal_mulai' => $joinDate, // Initial position started on join date
                        ];
                    }
                }

                // 2. Scan Career Paths 1 to 20 (Pairs of Date and Title starting right after startIdx)
                for ($col = $startIdx + 1; $col <= $startIdx + 30 && $col < count($row); $col += 2) {
                    $valA = trim((string) ($row[$col] ?? ''));
                    $valB = trim((string) ($row[$col + 1] ?? ''));

                    if ($valA === '' && $valB === '') {
                        continue;
                    }

                    $dateA = $parseDate($valA);
                    $dateB = $parseDate($valB);

                    $posDate = null;
                    $posTitle = null;

                    if ($dateA !== null && $valB !== '') {
                        $posDate = $dateA;
                        $posTitle = $valB;
                    } elseif ($dateB !== null && $valA !== '') {
                        $posDate = $dateB;
                        $posTitle = $valA;
                    } elseif ($valB !== '' && ! is_numeric($valB)) {
                        $posDate = null;
                        $posTitle = $valB;
                    } elseif ($valA !== '' && ! is_numeric($valA)) {
                        $posDate = null;
                        $posTitle = $valA;
                    }

                    if ($posTitle !== null && $posTitle !== '' && ! is_numeric($posTitle) && strcasecmp($posTitle, 'null') !== 0) {
                        $careerRawList[] = [
                            'jabatan' => $posTitle,
                            'tanggal_mulai' => $posDate,
                        ];
                    }
                }

                // 3. Fallback: If no career history found, record current position
                if (empty($careerRawList)) {
                    $careerRawList[] = [
                        'jabatan' => $currentPos,
                        'tanggal_mulai' => $joinDate,
                        'is_current' => true,
                    ];
                } else {
                    // Check if current position should be appended as active position
                    $lastItem = end($careerRawList);
                    if ($lastItem && strcasecmp(trim($lastItem['jabatan']), trim($currentPos)) !== 0) {
                        $careerRawList[] = [
                            'jabatan' => $currentPos,
                            'tanggal_mulai' => null,
                            'is_current' => true,
                        ];
                    }
                }

                // 4. Store Career Milestones into career_histories
                $totalCareers = count($careerRawList);
                $pegawai->careerHistory()->delete();

                foreach ($careerRawList as $idx => $cItem) {
                    $isCurrent = ($idx === $totalCareers - 1);
                    $startDate = $cItem['tanggal_mulai'] ?? null;
                    $endDate = null;

                    // End date is when next milestone starts
                    if (! $isCurrent && isset($careerRawList[$idx + 1]['tanggal_mulai'])) {
                        $endDate = $careerRawList[$idx + 1]['tanggal_mulai'];
                    }

                    [$itemDept, $itemUnit] = $detectDeptUnit($cItem['jabatan'], $departement, $unitName ?? $departement, $isCurrent);

                    $pegawai->careerHistory()->create([
                        'urutan' => $idx + 1,
                        'jabatan' => $cItem['jabatan'],
                        'departement' => $itemDept,
                        'unit' => $itemUnit,
                        'tanggal_mulai' => $startDate,
                        'tanggal_selesai' => $endDate,
                        'is_current' => $isCurrent,
                        'keterangan' => $isCurrent ? 'Posisi / Jabatan Terkini' : ($idx === 0 ? 'Posisi Awal Masuk' : 'Mutasi / Promosi Karir'),
                    ]);
                }

                // 6. Auto-Provision User Account with RBAC
                $resolved = $roleResolver->resolve($departement, $unitName, $currentPos, $jobLevel);
                $roleId = $resolved['role_id'];
                $roleName = $resolved['role_name'];

                $username = $employeeId ?: Str::slug($fullName, '.');
                $emailVal = $email ?: strtolower($username).'@alazhar.or.id';

                $user = User::where('employee_id', $pegawai->id)
                    ->orWhere('username', $username)
                    ->first();

                if ($user) {
                    $user->update([
                        'username' => $username,
                        'full_name' => $fullName,
                        'email' => $emailVal,
                        'role_id' => $roleId,
                        'employee_id' => $pegawai->id,
                        'is_active' => $isActive,
                    ]);
                } else {
                    User::create([
                        'username' => $username,
                        'full_name' => $fullName,
                        'email' => $emailVal,
                        'role_id' => $roleId,
                        'employee_id' => $pegawai->id,
                        'is_active' => $isActive,
                    ]);
                }

                if (isset($roleStats[$roleName])) {
                    $roleStats[$roleName]++;
                }

                $success++;
            }

            ImportLog::create([
                'user_id' => Auth::id() ?? 1,
                'type' => 'pegawai',
                'file_name' => $file->getClientOriginalName(),
                'total_rows' => count($rows) - 1,
                'success_rows' => $success,
                'failed_rows' => $failed,
                'status' => 'completed',
            ]);

            $summaryMsg = "Impor Berhasil! {$success} data amil dimasukkan ke database & struktur organisasi. Dibuat {$success} akun user RBAC: {$roleStats['admin_hr']} Admin HR, {$roleStats['finance']} Finance/Payroll, {$roleStats['manager_divisi']} Manager/Atasan, {$roleStats['staf_viewer']} Staf Viewer.";

            return redirect()->route('import.index')->with([
                'success' => $summaryMsg,
                'import_role_summary' => $roleStats,
            ]);
        } catch (\Exception $e) {
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return back()->withErrors(['file' => 'Terjadi kesalahan saat memproses impor: '.$e->getMessage()]);
        }
    }

    public function resetData()
    {
        Schema::disableForeignKeyConstraints();
        \App\Models\FamilyMember::truncate();
        \App\Models\CareerHistory::truncate();
        Pegawai::truncate();
        // Remove amil users (keep super admin)
        User::whereHas('role', function ($q) {
            $q->where('name', '!=', 'super_admin');
        })->orWhereNull('role_id')->delete();
        ImportLog::truncate();

        if (Schema::hasTable('attendances')) {
            \App\Models\Attendance::truncate();
        }
        if (Schema::hasTable('leave_requests')) {
            \App\Models\LeaveRequest::truncate();
        }
        if (Schema::hasTable('overtime_requests')) {
            DB::table('overtime_requests')->truncate();
        }
        if (Schema::hasTable('reimbursements')) {
            DB::table('reimbursements')->truncate();
        }
        if (Schema::hasTable('payroll_periods')) {
            DB::table('payroll_periods')->truncate();
        }
        Schema::enableForeignKeyConstraints();

        return redirect()->route('import.index')->with('success', 'Seluruh data amil, riwayat impor, dan akun login amil berhasil dikosongkan. Struktur organisasi & jabatan tetap utuh siap digunakan.');
    }
}
