<?php

namespace App\Jobs;

use App\Models\ImportLog;
use App\Models\Pegawai;
use App\Services\ImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected array $dataRows;

    protected ?int $logId;

    /**
     * Create a new job instance.
     */
    public function __construct(array $dataRows, ?int $logId = null)
    {
        $this->dataRows = $dataRows;
        $this->logId = $logId;
    }

    /**
     * Execute the job.
     */
    public function handle(ImportService $importService): void
    {
        Log::info('Starting ProcessImportJob with '.count($this->dataRows).' rows.');

        $logRecord = null;
        if ($this->logId) {
            $logRecord = ImportLog::find($this->logId);
        }

        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        foreach ($this->dataRows as $index => $row) {
            try {
                $normalized = $importService->normalizeRow($row);

                if (! $normalized) {
                    continue;
                }

                $pegawaiData = $normalized['pegawai'];

                DB::transaction(function () use ($normalized, $pegawaiData) {
                    $pegawai = Pegawai::updateOrCreate(
                        ['employee_id' => $pegawaiData['employee_id']],
                        $pegawaiData
                    );

                    $pegawai->familyMembers()->delete();
                    if (! empty($normalized['family'])) {
                        foreach ($normalized['family'] as $familyData) {
                            $pegawai->familyMembers()->create($familyData);
                        }
                    }

                    $pegawai->careerHistory()->delete();
                    if (! empty($normalized['career'])) {
                        foreach ($normalized['career'] as $careerData) {
                            $pegawai->careerHistory()->create($careerData);
                        }
                    }
                });

                $successCount++;
            } catch (\Exception $e) {
                $errorCount++;
                $name = $row[2] ?? 'Unknown';
                $empId = $row[1] ?? 'N/A';
                $errors[] = "Row {$index}: {$name} ({$empId}) — {$e->getMessage()}";
                Log::error("Import row {$index} ({$empId}): {$e->getMessage()}");
            }
        }

        if ($logRecord) {
            $logRecord->update([
                'success_rows' => $successCount,
                'failed_rows' => $errorCount,
                'errors' => $errors,
                'status' => $errorCount === 0 ? 'completed' : 'failed', // or partially_completed
            ]);
        }

        Log::info("ProcessImportJob finished. Success: {$successCount}, Errors: {$errorCount}");
    }
}
