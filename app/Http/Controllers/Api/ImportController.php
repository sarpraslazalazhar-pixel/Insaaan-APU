<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\PegawaiImport;
use App\Jobs\ProcessImportJob;
use App\Models\ImportLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ImportController extends Controller
{
    /**
     * Handle CSV/Excel file upload and queue the import job.
     */
    public function importFile(Request $request)
    {
        $request->validate([
            // Longgarkan validasi mime karena kadang OS/Browser mengirim application/octet-stream untuk .xlsx
            'file' => 'required|file|max:10240',
        ]);

        $extension = $request->file('file')->getClientOriginalExtension();
        if (! in_array(strtolower($extension), ['csv', 'xlsx', 'xls'])) {
            return response()->json([
                'message' => 'Format file tidak didukung. Harus .csv, .xlsx, atau .xls',
                'errors' => ['file' => ['Format file harus .csv, .xlsx, atau .xls']],
            ], 422);
        }

        try {
            $file = $request->file('file');

            // Workaround for Windows/PHP realpath() returning false on temp uploads
            $path = 'temp/' . $file->hashName();
            Storage::put($path, file_get_contents($file->getPathname()));
            $fullPath = Storage::path($path);

            $data = Excel::toArray(new PegawaiImport, $fullPath);

            if (empty($data) || empty($data[0])) {
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }

                return response()->json(['message' => 'File kosong atau tidak terbaca'], 400);
            }

            $rows = $data[0];

            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            // Dispatch job to process in background
            $importLog = ImportLog::create([
                'user_id' => $request->user()->id,
                'type' => 'pegawai',
                'file_name' => $file->getClientOriginalName(),
                'total_rows' => count($rows),
                'status' => 'processing',
            ]);

            ProcessImportJob::dispatch($rows, $importLog->id);

            return response()->json([
                'message' => 'File berhasil diunggah. Proses import berjalan di latar belakang.',
                'total_rows_detected' => count($rows),
                'log_id' => $importLog->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Import File Error: '.$e->getMessage());

            return response()->json([
                'message' => 'Terjadi kesalahan saat membaca file.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Preview 5 rows of the uploaded file for user review.
     */
    public function previewFile(Request $request)
    {
        $fileObject = $request->file('file') ?? $request->files->get('file');

        Log::info('Preview File Hit Detail: ', [
            'has_file' => $request->hasFile('file'),
            'is_valid' => $fileObject ? $fileObject->isValid() : false,
            'error_code' => $fileObject ? $fileObject->getError() : 'no_file_object',
            'client_name' => $fileObject ? $fileObject->getClientOriginalName() : null,
            'client_mime' => $fileObject ? $fileObject->getClientMimeType() : null,
            'real_path' => $fileObject ? $fileObject->getRealPath() : null,
            'path' => $fileObject ? $fileObject->path() : null,
        ]);

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $extension = $request->file('file')->getClientOriginalExtension();
        if (! in_array(strtolower($extension), ['csv', 'xlsx', 'xls'])) {
            return response()->json(['message' => 'Format file tidak didukung.'], 422);
        }

        try {
            $file = $request->file('file');

            // Workaround for Windows/PHP realpath() returning false on temp uploads
            $path = 'temp/' . $file->hashName();
            Storage::put($path, file_get_contents($file->getPathname()));
            $fullPath = Storage::path($path);

            $data = Excel::toArray(new PegawaiImport, $fullPath);

            if (empty($data) || empty($data[0])) {
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }

                return response()->json(['message' => 'File kosong atau tidak terbaca'], 400);
            }

            $rows = $data[0];
            $totalRows = count($rows);
            $previewRows = array_slice($rows, 0, 5);

            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return response()->json([
                'message' => 'Preview berhasil digenerate',
                'total_rows' => $totalRows,
                'preview' => $previewRows,
            ]);
        } catch (\Exception $e) {
            Log::error('Preview File Error: '.$e->getMessage());

            return response()->json([
                'message' => 'Terjadi kesalahan saat membaca file.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download CSV template matching Google Sheets format.
     */
    public function downloadTemplateCsv()
    {
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=template_import_pegawai.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'No.',
            'Employee ID',
            'Full Name',
            'Current Position',
            'Departement',
            'Unit',
            'Employment Status',
            'Divisi',
            'Status (Aktif & Non-Aktif)',
            'Mobile Phone Number',
            'Place of Birth',
            'Date of Birth',
            'Age',
            'Join Date',
            'Count Date (Today)',
            'Employement Count (Year)',
            'Employement Count (Month)',
            'Employement Count (Day)',
            'Email',
            'Education',
            'Citizen ID (NIK)',
            'Citizen ID Address',
            'Residential Address',
            'Gender',
            'Marital Status',
            'Spouse Name',
            'Spouse Date of Birth',
            'Child Name 1',
            'Child DOB 1',
            'Child Name 2',
            'Child DOB 2',
            'Child Name 3',
            'Child DOB 3',
            'Child Name 4',
            'Child DOB 4',
            'Graduation Date',
            'Educational Institution',
            'Institution Place',
            'Job Level',
            'Career Start',
            'Career Path 1',  // date
            'Career Path 2',  // title
            'Career Path 3',  // date
            'Career Path 4',  // title
            'Career Path 5',  // date
            'Career Path 6',  // title
            'Career Path 7',  // date
            'Career Path 8',  // title
            'Career Path 9',  // date
            'Career Path 10', // title
            'Career Path 11', // date
            'Career Path 12', // title
        ];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get import logs list.
     */
    public function importLogs(Request $request)
    {
        $logs = ImportLog::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($logs);
    }

    /**
     * Get single import log detail.
     */
    public function importLogDetail(int $id)
    {
        $log = ImportLog::findOrFail($id);

        return response()->json($log);
    }

    /**
     * Preview 5 rows of the Google Sheets data.
     */
    public function previewSheets(Request $request)
    {
        $request->validate(['sheet_url' => 'required|string']);
        
        try {
            $sheetInput = $request->sheet_url;
            $sheetId = preg_match('/spreadsheets\/d\/([a-zA-Z0-9-_]+)/', $sheetInput, $matches) ? $matches[1] : $sheetInput;
            $url = "https://docs.google.com/spreadsheets/d/{$sheetId}/export?format=csv";
            
            $response = Http::get($url);
            if (!$response->successful()) {
                return response()->json(['message' => 'Gagal mengambil data dari Google Sheets.'], 400);
            }

            $tempPath = 'temp/sheet_' . time() . '.csv';
            Storage::put($tempPath, $response->body());
            $fullPath = Storage::path($tempPath);

            $data = Excel::toArray(new PegawaiImport, $fullPath);

            if (empty($data) || empty($data[0])) {
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
                return response()->json(['message' => 'File kosong atau tidak terbaca'], 400);
            }

            $rows = $data[0];
            $totalRows = count($rows);
            $previewRows = array_slice($rows, 0, 5);

            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return response()->json([
                'message' => 'Preview berhasil digenerate',
                'total_rows' => $totalRows,
                'preview' => $previewRows,
            ]);
        } catch (\Exception $e) {
            Log::error('Preview Sheets Error: '.$e->getMessage());
            return response()->json([
                'message' => 'Terjadi kesalahan saat membaca Google Sheets.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import data from Google Sheets.
     */
    public function importSheets(Request $request)
    {
        $request->validate(['sheet_url' => 'required|string']);

        try {
            $sheetInput = $request->sheet_url;
            $sheetId = preg_match('/spreadsheets\/d\/([a-zA-Z0-9-_]+)/', $sheetInput, $matches) ? $matches[1] : $sheetInput;
            $url = "https://docs.google.com/spreadsheets/d/{$sheetId}/export?format=csv";
            
            $response = Http::get($url);
            if (!$response->successful()) {
                return response()->json(['message' => 'Gagal mengambil data dari Google Sheets.'], 400);
            }

            $tempPath = 'temp/sheet_' . time() . '.csv';
            Storage::put($tempPath, $response->body());
            $fullPath = Storage::path($tempPath);

            $data = Excel::toArray(new PegawaiImport, $fullPath);

            if (empty($data) || empty($data[0])) {
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
                return response()->json(['message' => 'File kosong atau tidak terbaca'], 400);
            }

            $rows = $data[0];

            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            $importLog = ImportLog::create([
                'user_id' => $request->user()->id,
                'type' => 'pegawai_sheets',
                'file_name' => 'Google Sheets Import',
                'total_rows' => count($rows),
                'status' => 'processing',
            ]);

            ProcessImportJob::dispatch($rows, $importLog->id);

            return response()->json([
                'message' => 'Proses import dari Google Sheets berjalan di latar belakang.',
                'total_rows_detected' => count($rows),
                'log_id' => $importLog->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Import Sheets Error: '.$e->getMessage());
            return response()->json([
                'message' => 'Terjadi kesalahan saat memproses data Google Sheets.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

