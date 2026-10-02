import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';
import { swalSuccess, swalError } from '../../lib/swal';
import ExcelJS from 'exceljs';

interface ImportLog {
  id: number;
  file_name: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  status: string;
  created_at: string;
  errors?: string[];
}

interface Props {
  logs: ImportLog[];
  preview?: {
    total_rows: number;
    preview: any[][];
  } | null;
  roleSummary?: {
    admin_hr: number;
    finance: number;
    manager_divisi: number;
    staf_viewer: number;
  } | null;
}

export const Index: React.FC<Props> = ({ logs = [], preview = null, roleSummary = null }) => {
  const { data, setData, post, processing, progress, reset } = useForm<{
    file: File | null;
  }>({
    file: null,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setData('file', file);
    }
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.file) return;
    post('/import/preview', {
      preserveState: true,
      onError: () => swalError('Gagal memuat pratinjau file'),
    });
  };

  const handleImport = () => {
    if (!data.file) return;
    post('/import/file', {
      onSuccess: () => {
        swalSuccess('File berhasil diunggah & diproses');
        setSelectedFile(null);
        reset();
      },
      onError: (errs) => {
        swalError('Gagal melakukan impor', Object.values(errs).join(', '));
      },
    });
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template Import Karyawan');

    sheet.columns = [
      { header: 'No.', key: 'no', width: 6 },
      { header: 'Employee ID', key: 'employee_id', width: 16 },
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'Current Position', key: 'current_position', width: 20 },
      { header: 'Departement', key: 'departement', width: 20 },
      { header: 'Unit', key: 'unit', width: 18 },
      { header: 'Employment Status', key: 'employment_status', width: 18 },
      { header: 'Job Level', key: 'job_level', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Join Date', key: 'join_date', width: 15 },
    ];

    sheet.addRow({
      no: 1,
      employee_id: 'AMIL-001',
      full_name: 'Fulan bin Fulan',
      current_position: 'Staf Fundraising',
      departement: 'Penghimpunan',
      unit: 'Kantor Pusat',
      employment_status: 'Tetap',
      job_level: 'Staf',
      gender: 'L',
      email: 'fulan@alazhar.or.id',
      join_date: '2024-01-01',
    });

    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Import_Pegawai_InsaanAPU.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Import Data Karyawan">
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">Import Data Pegawai</h2>
            <p className="text-sm text-[#434654] mt-1">Unggah spreadsheet Excel atau CSV untuk migrasi data awal amil</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Kosongkan semua data amil, riwayat impor, dan akun amil di database? Struktur organisasi & jabatan tetap dipertahankan.')) {
                  router.post('/import/reset-data');
                }
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200"
              title="Bersihkan data amil sebelum mulai impor baru"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              Kosongkan Data Amil
            </button>
            <button
              onClick={downloadTemplate}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-[#0b1c30] font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">file_download</span>
              Unduh Format Template Excel
            </button>
          </div>
        </div>

        {/* Informational Guidance on RBAC & Old Excel Support */}
        <div className="bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-[#0053d0] text-white material-symbols-outlined text-xl shrink-0">
              auto_awesome
            </span>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-[#0b1c30]">
                Mendukung 100% Format File Excel Lama Anda
              </h4>
              <p className="text-xs text-[#434654] leading-relaxed">
                Anda dapat langsung mengunggah file data spreadsheet yang ada (dengan kolom <code className="bg-blue-100 text-[#0053d0] px-1 py-0.5 rounded font-mono text-[11px]">Employee ID</code>, <code className="bg-blue-100 text-[#0053d0] px-1 py-0.5 rounded font-mono text-[11px]">Full Name</code>, <code className="bg-blue-100 text-[#0053d0] px-1 py-0.5 rounded font-mono text-[11px]">Departement</code>, <code className="bg-blue-100 text-[#0053d0] px-1 py-0.5 rounded font-mono text-[11px]">Unit</code>, <code className="bg-blue-100 text-[#0053d0] px-1 py-0.5 rounded font-mono text-[11px]">Job Level</code>).
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="text-slate-500">Otomasi Sistem:</span>
                <span className="px-2.5 py-0.5 bg-blue-100 text-[#0053d0] rounded-full">
                  ✓ Masuk ke Struktur Organisasi &amp; Jabatan
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  ✓ Akun Login Dibuat Otomatis (User ID = NIP Amil)
                </span>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                  ✓ Role RBAC PRD Ditetapkan Sesuai Jabatan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Distribution Result Banner if just imported */}
        {roleSummary && (
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500/40 shadow-md shadow-emerald-500/10 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-xl">verified_user</span>
              <h4 className="font-extrabold text-sm text-[#0b1c30]">
                Rincian Akun Login Amil Berdasarkan RBAC PRD.md:
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                <span className="text-[#737686] block text-[11px] font-bold">Admin HR</span>
                <span className="text-lg font-black text-[#0053d0]">{roleSummary.admin_hr || 0}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Kelola data amil, shift, cuti</p>
              </div>
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100">
                <span className="text-[#737686] block text-[11px] font-bold">Finance / Payroll</span>
                <span className="text-lg font-black text-purple-700">{roleSummary.finance || 0}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Payroll &amp; reimbursement</p>
              </div>
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                <span className="text-[#737686] block text-[11px] font-bold">Manager Divisi</span>
                <span className="text-lg font-black text-amber-700">{roleSummary.manager_divisi || 0}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Approver cuti/lembur tim</p>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                <span className="text-[#737686] block text-[11px] font-bold">Staf Viewer</span>
                <span className="text-lg font-black text-emerald-700">{roleSummary.staf_viewer || 0}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Self service absensi &amp; slip</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white p-8 rounded-2xl border border-blue-50/50 shadow-sm space-y-6">
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="border-2 border-dashed border-blue-200 hover:border-[#0053d0] rounded-2xl p-8 text-center transition-colors bg-[#f8f9ff]">
              <input
                type="file"
                id="fileInput"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0053d0] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">upload_file</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-[#0b1c30]">
                    {selectedFile ? selectedFile.name : 'Klik untuk memilih file CSV atau Excel'}
                  </p>
                  <p className="text-xs text-[#737686] mt-1">Mendukung format .xlsx, .xls, dan .csv (Maksimal 10MB)</p>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0b1c30] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Pratinjau Data
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={processing}
                  className="px-6 py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  {processing ? 'Memproses...' : 'Proses Impor Sekarang'}
                </button>
              </div>
            )}
          </form>

          {/* Preview Table */}
          {preview && (
            <div className="pt-6 border-t border-blue-50 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#0b1c30]">
                  Pratinjau {preview.preview?.length || 0} Baris Pertama (Total {preview.total_rows} baris terdeteksi)
                </h3>
              </div>
              <div className="overflow-x-auto border border-blue-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-blue-50">
                    {preview.preview?.map((row: any[], rIdx: number) => (
                      <tr key={rIdx} className={rIdx === 0 ? 'bg-[#f8f9ff] font-bold' : ''}>
                        {row.slice(0, 8).map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap">
                            {cell !== null && cell !== undefined ? String(cell) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Import Logs */}
        <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#0b1c30]">Riwayat Impor Data Terakhir</h3>
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat impor yang tercatat.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9ff] text-[#737686] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Nama File</th>
                    <th className="py-3 px-4">Total Baris</th>
                    <th className="py-3 px-4">Sukses</th>
                    <th className="py-3 px-4">Gagal</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/20">
                      <td className="py-3 px-4 font-bold text-[#0b1c30]">{log.file_name}</td>
                      <td className="py-3 px-4">{log.total_rows}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">{log.success_rows}</td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">{log.failed_rows}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.status === 'failed'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{log.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
