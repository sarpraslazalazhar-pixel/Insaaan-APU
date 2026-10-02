<?php

use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\OrganisasiController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\RecruitmentController;
use Illuminate\Support\Facades\Route;

// Public Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Public Career Portal
Route::get('/karir', [RecruitmentController::class, 'publicIndex'])->name('karir.index');
Route::post('/karir/lamar', [RecruitmentController::class, 'applyPublic'])->name('karir.lamar');

// Protected Routes (Session Web Authentication)
Route::middleware('auth')->group(function () {
    Route::get('/', function () {
        return redirect()->route('dashboard');
    });

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // M3: Administrasi SDM (Pegawai)
    Route::get('/pegawai', [PegawaiController::class, 'index'])->name('pegawai.index');
    Route::get('/pegawai/create', [PegawaiController::class, 'create'])->name('pegawai.create');
    Route::post('/pegawai', [PegawaiController::class, 'store'])->name('pegawai.store');
    Route::get('/pegawai/{id}', [PegawaiController::class, 'show'])->name('pegawai.show');
    Route::get('/pegawai/{id}/edit', [PegawaiController::class, 'edit'])->name('pegawai.edit');
    Route::put('/pegawai/{id}', [PegawaiController::class, 'update'])->name('pegawai.update');
    Route::delete('/pegawai/{id}', [PegawaiController::class, 'destroy'])->name('pegawai.destroy');
    Route::post('/pegawai/{id}/documents', [PegawaiController::class, 'uploadDocument'])->name('pegawai.documents.store');
    Route::delete('/pegawai/documents/{id}', [PegawaiController::class, 'deleteDocument'])->name('pegawai.documents.destroy');

    // M3: Struktur Organisasi (HR-02)
    Route::get('/organisasi', [OrganisasiController::class, 'index'])->name('organisasi.index');
    Route::post('/organisasi/unit', [OrganisasiController::class, 'storeUnit'])->name('organisasi.unit.store');
    Route::delete('/organisasi/unit/{id}', [OrganisasiController::class, 'destroyUnit'])->name('organisasi.unit.destroy');
    Route::post('/organisasi/position', [OrganisasiController::class, 'storePosition'])->name('organisasi.position.store');
    Route::put('/organisasi/position/{id}', [OrganisasiController::class, 'updatePosition'])->name('organisasi.position.update');
    Route::delete('/organisasi/position/{id}', [OrganisasiController::class, 'destroyPosition'])->name('organisasi.position.destroy');
    Route::post('/organisasi/reset', [OrganisasiController::class, 'resetAll'])->name('organisasi.reset');
    Route::post('/organisasi/seed-default', [OrganisasiController::class, 'seedDefault'])->name('organisasi.seedDefault');

    // M3: Import Data
    Route::get('/import', [ImportController::class, 'index'])->name('import.index');
    Route::post('/import/preview', [ImportController::class, 'preview'])->name('import.preview');
    Route::post('/import/file', [ImportController::class, 'import'])->name('import.file');
    Route::post('/import/reset-data', [ImportController::class, 'resetData'])->name('import.resetData');

    // M1: Kehadiran & Lembur
    Route::get('/kehadiran', [AttendanceController::class, 'index'])->name('kehadiran.index');
    Route::post('/kehadiran/clock-in', [AttendanceController::class, 'clockIn'])->name('kehadiran.clockIn');
    Route::post('/kehadiran/clock-out', [AttendanceController::class, 'clockOut'])->name('kehadiran.clockOut');
    Route::post('/kehadiran/cuti', [AttendanceController::class, 'storeLeave'])->name('kehadiran.cuti');
    Route::post('/kehadiran/lembur', [AttendanceController::class, 'storeOvertime'])->name('kehadiran.lembur');

    // M2: Penggajian & Reimbursement
    Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::post('/payroll/generate', [PayrollController::class, 'generate'])->name('payroll.generate');
    Route::post('/payroll/reimbursement', [PayrollController::class, 'storeReimbursement'])->name('payroll.reimbursement');

    // M4: Rekrutmen & ATS
    Route::get('/rekrutmen', [RecruitmentController::class, 'index'])->name('rekrutmen.index');
    Route::post('/rekrutmen/lowongan', [RecruitmentController::class, 'storeVacancy'])->name('rekrutmen.storeVacancy');
    Route::put('/rekrutmen/kandidat/{id}/stage', [RecruitmentController::class, 'updateCandidateStage'])->name('rekrutmen.updateStage');
    Route::post('/rekrutmen/kandidat/{id}/onboard', [RecruitmentController::class, 'onboardCandidate'])->name('rekrutmen.onboard');

    // Cross-Module: Unified Approval Engine
    Route::get('/approvals', [ApprovalController::class, 'index'])->name('approvals.index');
    Route::post('/approvals/{type}/{id}/approve', [ApprovalController::class, 'approve'])->name('approvals.approve');
    Route::post('/approvals/{type}/{id}/reject', [ApprovalController::class, 'reject'])->name('approvals.reject');
});
