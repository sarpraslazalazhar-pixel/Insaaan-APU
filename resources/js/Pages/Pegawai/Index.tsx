import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';
import { swalConfirm, swalSuccess, swalError } from '../../lib/swal';
import ExcelJS from 'exceljs';

interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  current_position: string | null;
  departement: string | null;
  unit: string | null;
  employment_status: string;
  job_level: string | null;
  gender: string | null;
  is_active: boolean;
  join_date: string | null;
  contract_end_date: string | null;
  mobile_phone_number: string | null;
  email: string | null;
}

interface Props {
  pegawai: {
    data: Employee[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links: any[];
  } | Employee[];
  filters: any;
  divisions: string[];
  units: string[];
  jobLevels: string[];
}

export const Index: React.FC<Props> = ({ pegawai, filters = {}, divisions = [], units = [], jobLevels = [] }) => {
  const employeeList: Employee[] = Array.isArray(pegawai) ? pegawai : pegawai?.data || [];

  const [search, setSearch] = useState(filters.search || '');
  const [division, setDivision] = useState(filters.division || '');
  const [unit, setUnit] = useState(filters.unit || '');
  const [status, setStatus] = useState(filters.status || '');
  const [jobLevel, setJobLevel] = useState(filters.job_level || '');
  const [gender, setGender] = useState(filters.gender || '');
  const [isActive, setIsActive] = useState(filters.is_active ?? '');

  const applyFilters = (newFilters: any) => {
    router.get('/pegawai', {
      search,
      division,
      unit,
      status,
      job_level: jobLevel,
      gender,
      is_active: isActive,
      ...newFilters,
    }, { preserveState: true, replace: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleDelete = (id: number, name: string) => {
    swalConfirm({
      title: 'Hapus Karyawan?',
      text: `Apakah Anda yakin ingin menonaktifkan data ${name}?`,
      confirmText: 'Ya, Nonaktifkan',
    }).then((res) => {
      if (res.isConfirmed) {
        router.delete(`/pegawai/${id}`, {
          onSuccess: () => swalSuccess('Karyawan dinonaktifkan'),
          onError: () => swalError('Gagal menonaktifkan karyawan'),
        });
      }
    });
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Karyawan');

    sheet.columns = [
      { header: 'No.', key: 'no', width: 6 },
      { header: 'ID Karyawan', key: 'employee_id', width: 15 },
      { header: 'Nama Lengkap', key: 'full_name', width: 25 },
      { header: 'Jabatan', key: 'position', width: 20 },
      { header: 'Divisi', key: 'departement', width: 20 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Status Kerja', key: 'employment_status', width: 15 },
      { header: 'Level', key: 'job_level', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Status Aktif', key: 'is_active', width: 12 },
      { header: 'Tgl Masuk', key: 'join_date', width: 15 },
    ];

    employeeList.forEach((emp, i) => {
      sheet.addRow({
        no: i + 1,
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        position: emp.current_position || '-',
        departement: emp.departement || '-',
        unit: emp.unit || '-',
        employment_status: emp.employment_status || '-',
        job_level: emp.job_level || '-',
        gender: emp.gender === 'L' ? 'Laki-laki' : (emp.gender === 'P' ? 'Perempuan' : '-'),
        is_active: emp.is_active ? 'Aktif' : 'Non-Aktif',
        join_date: emp.join_date || '-',
      });
    });

    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Karyawan_InsaanAPU_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Data Karyawan">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">Data Amil &amp; Karyawan</h2>
            <p className="text-sm text-[#434654] mt-1">Kelola direktori amil, nadzhir, riwayat karir, dan data keluarga</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportExcel}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-[#0b1c30] font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Ekspor Excel
            </button>
            <Link
              href="/pegawai/create"
              className="bg-[#0053d0] hover:bg-[#0043a8] text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Tambah Karyawan
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-5 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737686]">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan nama, ID amil, jabatan..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl text-sm focus:bg-white focus:border-[#0053d0] outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0053d0] text-white text-xs font-bold rounded-xl hover:bg-[#0043a8] transition-colors cursor-pointer"
            >
              Cari
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <select
              value={division}
              onChange={(e) => { setDivision(e.target.value); applyFilters({ division: e.target.value }); }}
              className="px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none font-medium text-[#434654]"
            >
              <option value="">Semua Divisi</option>
              {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={unit}
              onChange={(e) => { setUnit(e.target.value); applyFilters({ unit: e.target.value }); }}
              className="px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none font-medium text-[#434654]"
            >
              <option value="">Semua Unit</option>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
              className="px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none font-medium text-[#434654]"
            >
              <option value="">Semua Status</option>
              <option value="Tetap">Tetap</option>
              <option value="Kontrak">Kontrak</option>
              <option value="Relawan">Relawan</option>
            </select>

            <select
              value={jobLevel}
              onChange={(e) => { setJobLevel(e.target.value); applyFilters({ job_level: e.target.value }); }}
              className="px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none font-medium text-[#434654]"
            >
              <option value="">Semua Level</option>
              {jobLevels.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>

            <select
              value={gender}
              onChange={(e) => { setGender(e.target.value); applyFilters({ gender: e.target.value }); }}
              className="px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none font-medium text-[#434654]"
            >
              <option value="">Semua Gender</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>

            <select
              value={isActive}
              onChange={(e) => { setIsActive(e.target.value); applyFilters({ is_active: e.target.value }); }}
              className="px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none font-medium text-[#434654]"
            >
              <option value="">Semua Keaktifan</option>
              <option value="1">Aktif</option>
              <option value="0">Non-Aktif</option>
            </select>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-2xl border border-blue-50/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9ff] border-b border-blue-100 text-[#737686] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-5">Amil / Karyawan</th>
                  <th className="py-4 px-4">ID &amp; Posisi</th>
                  <th className="py-4 px-4">Divisi &amp; Unit</th>
                  <th className="py-4 px-4">Status &amp; Level</th>
                  <th className="py-4 px-4">Keaktifan</th>
                  <th className="py-4 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {employeeList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Tidak ada data amil / karyawan ditemukan.
                    </td>
                  </tr>
                ) : (
                  employeeList.map((emp) => {
                    const initials = emp.full_name
                      ? emp.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'IA';
                    return (
                      <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0053d0] font-bold flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <Link
                                href={`/pegawai/${emp.id}`}
                                className="font-bold text-[#0b1c30] hover:text-[#0053d0] text-sm"
                              >
                                {emp.full_name}
                              </Link>
                              <p className="text-[11px] text-[#737686]">{emp.email || emp.email_kantor || emp.mobile_phone || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-[#0b1c30]">{emp.employee_id}</p>
                            {emp.is_field_staff && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">Lapangan</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#737686]">{emp.position?.name || emp.current_position || '-'}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#0b1c30]">{emp.org_unit?.name || emp.departement || '-'}</p>
                          <p className="text-[11px] text-[#737686]">
                            {emp.manager ? `Atasan: ${emp.manager.full_name}` : (emp.unit || '-')}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.employment_status === 'Tetap'
                              ? 'bg-blue-100 text-blue-800'
                              : emp.employment_status === 'Kontrak'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {emp.employment_status || '-'}
                          </span>
                          <p className="text-[10px] text-[#737686] mt-1">{emp.job_level || '-'}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            emp.is_active
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {emp.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/pegawai/${emp.id}`}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title="Detail"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </Link>
                            <Link
                              href={`/pegawai/${emp.id}/edit`}
                              className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </Link>
                            {emp.is_active && (
                              <button
                                onClick={() => handleDelete(emp.id, emp.full_name)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Nonaktifkan"
                              >
                                <span className="material-symbols-outlined text-[18px]">person_off</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!Array.isArray(pegawai) && pegawai?.links && pegawai.links.length > 3 && (
            <div className="p-4 border-t border-blue-50 flex items-center justify-between text-xs text-[#737686]">
              <span>Menampilkan {pegawai.data.length} dari {pegawai.total} karyawan</span>
              <div className="flex gap-1">
                {pegawai.links.map((link: any, idx: number) => (
                  <button
                    key={idx}
                    disabled={!link.url || link.active}
                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      link.active
                        ? 'bg-[#0053d0] text-white border-[#0053d0]'
                        : link.url
                        ? 'border-slate-200 hover:bg-slate-50 text-[#0b1c30]'
                        : 'border-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
