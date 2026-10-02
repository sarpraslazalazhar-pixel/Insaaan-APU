import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';
import { swalSuccess, swalError } from '../../lib/swal';

interface Props {
  summary: {
    hadir: number;
    izin: number;
    sakit: number;
    cuti: number;
    terlambat: number;
  };
  todayLogs: any[];
  userAttendanceToday: any;
  leaveRequests: any[];
  overtimeRequests: any[];
  shifts: any[];
  currentMonthOvertimeHours: number;
}

export const Index: React.FC<Props> = ({
  summary = { hadir: 0, izin: 0, sakit: 0, cuti: 0, terlambat: 0 },
  todayLogs = [],
  userAttendanceToday = null,
  leaveRequests = [],
  overtimeRequests = [],
  shifts = [],
  currentMonthOvertimeHours = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'absensi' | 'cuti' | 'lembur' | 'shift'>('monitoring');

  // Absensi Clock In / Out
  const handleClockIn = () => {
    router.post('/kehadiran/clock-in', {}, {
      onSuccess: () => swalSuccess('Presensi Masuk Berhasil dicatat'),
      onError: () => swalError('Gagal melakukan presensi masuk'),
    });
  };

  const handleClockOut = () => {
    router.post('/kehadiran/clock-out', {}, {
      onSuccess: () => swalSuccess('Presensi Pulang Berhasil dicatat'),
      onError: () => swalError('Gagal melakukan presensi pulang'),
    });
  };

  // Form Pengajuan Cuti
  const leaveForm = useForm({
    type: 'Tahunan',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const submitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    leaveForm.post('/kehadiran/cuti', {
      onSuccess: () => {
        swalSuccess('Pengajuan cuti berhasil dikirim ke atasan');
        leaveForm.reset();
      },
      onError: () => swalError('Gagal mengajukan cuti'),
    });
  };

  // Form Pengajuan Lembur (Before Shift / After Shift)
  const overtimeForm = useForm({
    type: 'after_shift',
    date: new Date().toISOString().slice(0, 10),
    start_time: '17:00',
    end_time: '19:00',
    hours: 2,
    reason: '',
  });

  const submitOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMonthOvertimeHours + Number(overtimeForm.data.hours) > 40) {
      if (!confirm('Peringatan: Total jam lembur bulan ini melebihi batas 40 jam. Tetap lanjutkan pengajuan?')) {
        return;
      }
    }
    overtimeForm.post('/kehadiran/lembur', {
      onSuccess: () => {
        swalSuccess('Pengajuan lembur berhasil dikirim ke atasan');
        overtimeForm.reset();
      },
      onError: () => swalError('Gagal mengajukan lembur'),
    });
  };

  return (
    <AppLayout title="Manajemen Kehadiran & Cuti">
      <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">Manajemen Kehadiran Amil</h2>
            <p className="text-sm text-[#434654] mt-1">Presensi mandiri, pengajuan cuti, jadwal shift, dan lembur (tarif Rp10.000/jam)</p>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex overflow-x-auto border-b border-blue-100 gap-6 scroll-hidden text-sm font-bold">
          {[
            { id: 'monitoring', label: 'Monitoring Harian', icon: 'dashboard' },
            { id: 'absensi', label: 'Presensi Saya', icon: 'fingerprint' },
            { id: 'cuti', label: 'Cuti & Izin', icon: 'event_note' },
            { id: 'lembur', label: 'Lembur', icon: 'more_time' },
            { id: 'shift', label: 'Jadwal Shift', icon: 'schedule' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === t.id
                  ? 'border-[#0053d0] text-[#0053d0]'
                  : 'border-transparent text-[#737686] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Monitoring Harian */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-50/50 shadow-sm">
                <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">Hadir Hari Ini</span>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">{summary.hadir}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-50/50 shadow-sm">
                <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">Terlambat</span>
                <p className="text-3xl font-extrabold text-amber-500 mt-1">{summary.terlambat}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-50/50 shadow-sm">
                <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">Cuti / Izin</span>
                <p className="text-3xl font-extrabold text-blue-600 mt-1">{summary.cuti + summary.izin}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-50/50 shadow-sm">
                <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">Sakit</span>
                <p className="text-3xl font-extrabold text-rose-600 mt-1">{summary.sakit}</p>
              </div>
            </div>

            {/* Attendance Logs */}
            <div className="bg-white rounded-2xl border border-blue-50/50 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30]">Log Presensi Hari Ini</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9ff] text-[#737686] font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Amil</th>
                      <th className="py-3 px-4">Divisi</th>
                      <th className="py-3 px-4">Masuk</th>
                      <th className="py-3 px-4">Pulang</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {todayLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada log presensi hari ini.
                        </td>
                      </tr>
                    ) : (
                      todayLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-blue-50/20">
                          <td className="py-3 px-4 font-bold text-[#0b1c30]">
                            {log.pegawai?.full_name || 'Amil'}
                          </td>
                          <td className="py-3 px-4 text-[#737686]">
                            {log.pegawai?.departement || '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-600">
                            {log.clock_in || '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-blue-600">
                            {log.clock_out || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 capitalize">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Presensi Saya */}
        {activeTab === 'absensi' && (
          <div className="bg-white p-8 rounded-2xl border border-blue-50/50 shadow-sm max-w-md mx-auto text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-blue-50 text-[#0053d0] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-4xl">fingerprint</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#0b1c30]">Presensi Mandiri Amil</h3>
              <p className="text-xs text-[#737686] mt-1">Waktu dicatat otomatis oleh server resmi (WIB)</p>
            </div>

            <div className="p-4 bg-[#f8f9ff] rounded-xl border border-blue-100 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[#737686]">Jam Masuk Hari Ini:</span>
                <span className="font-bold text-emerald-600">{userAttendanceToday?.clock_in || 'Belum Presensi'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737686]">Jam Pulang Hari Ini:</span>
                <span className="font-bold text-blue-600">{userAttendanceToday?.clock_out || '-'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClockIn}
                disabled={Boolean(userAttendanceToday?.clock_in)}
                className="flex-1 py-3 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer"
              >
                Clock In (Masuk)
              </button>
              <button
                type="button"
                onClick={handleClockOut}
                disabled={!userAttendanceToday?.clock_in || Boolean(userAttendanceToday?.clock_out)}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer"
              >
                Clock Out (Pulang)
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Cuti & Izin */}
        {activeTab === 'cuti' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30]">Formulir Pengajuan Cuti</h3>
              <form onSubmit={submitLeave} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Jenis Cuti</label>
                  <select
                    value={leaveForm.data.type}
                    onChange={(e) => leaveForm.setData('type', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  >
                    <option value="Tahunan">Cuti Tahunan</option>
                    <option value="Sakit">Cuti Sakit (Surat Dokter)</option>
                    <option value="Melahirkan">Cuti Melahirkan</option>
                    <option value="Haji / Umrah">Cuti Haji / Umrah</option>
                    <option value="Menikah">Cuti Menikah</option>
                    <option value="Khusus">Izin Khusus / Keperluan Mendesak</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.data.start_date}
                    onChange={(e) => leaveForm.setData('start_date', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.data.end_date}
                    onChange={(e) => leaveForm.setData('end_date', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Alasan Pengajuan</label>
                  <textarea
                    rows={3}
                    required
                    value={leaveForm.data.reason}
                    onChange={(e) => leaveForm.setData('reason', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="Tuliskan keterangan cuti..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={leaveForm.processing}
                  className="w-full py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Ajukan Cuti
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30]">Daftar Pengajuan Cuti</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9ff] text-[#737686] font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Amil</th>
                      <th className="py-2.5 px-3">Jenis</th>
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Belum ada pengajuan cuti.
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((lv: any) => (
                        <tr key={lv.id}>
                          <td className="py-2.5 px-3 font-bold">{lv.pegawai?.full_name || 'Amil'}</td>
                          <td className="py-2.5 px-3">{lv.type}</td>
                          <td className="py-2.5 px-3 text-slate-500">{lv.start_date} s/d {lv.end_date}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lv.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {lv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Lembur */}
        {activeTab === 'lembur' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                <h3 className="font-bold text-sm text-[#0b1c30]">Pengajuan Lembur</h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Rp10.000 / Jam
                </span>
              </div>

              {/* Soft limit warning banner */}
              <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-[#0053d0]">
                <p className="font-bold">Total Lembur Bulan Ini: {currentMonthOvertimeHours} / 40 Jam</p>
                <p className="text-[10px] text-blue-800/80 mt-0.5">
                  Batas 40 jam adalah batas toleransi (soft limit). Pengajuan tetap dapat dilakukan dengan notifikasi ke atasan.
                </p>
              </div>

              <form onSubmit={submitOvertime} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Jenis Lembur</label>
                  <select
                    value={overtimeForm.data.type}
                    onChange={(e) => overtimeForm.setData('type', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  >
                    <option value="after_shift">After Shift (Setelah Jam Pulang)</option>
                    <option value="before_shift">Before Shift (Sebelum Jam Masuk)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tanggal Lembur</label>
                  <input
                    type="date"
                    required
                    value={overtimeForm.data.date}
                    onChange={(e) => overtimeForm.setData('date', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[#434654] block mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      required
                      value={overtimeForm.data.start_time}
                      onChange={(e) => overtimeForm.setData('start_time', e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#434654] block mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      required
                      value={overtimeForm.data.end_time}
                      onChange={(e) => overtimeForm.setData('end_time', e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Durasi Jam (Per Jam Penuh)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={overtimeForm.data.hours}
                    onChange={(e) => overtimeForm.setData('hours', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Alasan Penugasan Lembur</label>
                  <textarea
                    rows={2}
                    required
                    value={overtimeForm.data.reason}
                    onChange={(e) => overtimeForm.setData('reason', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="Contoh: Rekonsiliasi donasi akhir bulan..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={overtimeForm.processing}
                  className="w-full py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Ajukan Lembur
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30]">Daftar Pengajuan Lembur Amil</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9ff] text-[#737686] font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Amil</th>
                      <th className="py-2.5 px-3">Jenis</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Durasi</th>
                      <th className="py-2.5 px-3">Nominal (Rp10rb/jam)</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {overtimeRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Belum ada pengajuan lembur yang tercatat.
                        </td>
                      </tr>
                    ) : (
                      overtimeRequests.map((ot: any) => (
                        <tr key={ot.id}>
                          <td className="py-2.5 px-3 font-bold">{ot.pegawai?.full_name || 'Amil'}</td>
                          <td className="py-2.5 px-3 capitalize">{ot.type === 'before_shift' ? 'Before Shift' : 'After Shift'}</td>
                          <td className="py-2.5 px-3">{ot.date}</td>
                          <td className="py-2.5 px-3">{ot.hours} Jam</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600">Rp {(ot.hours * 10000).toLocaleString('id-ID')}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ot.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {ot.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Shift */}
        {activeTab === 'shift' && (
          <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4 animate-fade-in">
            <h3 className="font-bold text-sm text-[#0b1c30]">Master &amp; Jadwal Shift Kerja</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#f8f9ff] border border-blue-100 rounded-xl">
                <p className="font-bold text-[#0053d0]">Shift Normal (Kantor Pusat)</p>
                <p className="text-xs text-[#434654] mt-1">08:00 WIB - 17:00 WIB (Istirahat: 12:00 - 13:00)</p>
              </div>
              <div className="p-4 bg-[#f8f9ff] border border-blue-100 rounded-xl">
                <p className="font-bold text-[#0053d0]">Shift Siaga Fundraising</p>
                <p className="text-xs text-[#434654] mt-1">10:00 WIB - 19:00 WIB (Istirahat: 13:00 - 14:00)</p>
              </div>
              <div className="p-4 bg-[#f8f9ff] border border-blue-100 rounded-xl">
                <p className="font-bold text-[#0053d0]">Shift Lapangan Tanggap Darurat</p>
                <p className="text-xs text-[#434654] mt-1">Penugasan Lintas Hari (Flexi Shift)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
