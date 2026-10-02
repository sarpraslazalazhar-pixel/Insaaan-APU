import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';
import { swalSuccess, swalError } from '../../lib/swal';

interface Props {
  periods: any[];
  reimbursements: any[];
  components: any[];
}

export const Index: React.FC<Props> = ({ periods = [], reimbursements = [], components = [] }) => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'reimbursement' | 'komponen'>('payroll');

  // Form Pengajuan Reimbursement
  const claimForm = useForm({
    category: 'Transport & Operasional Lapangan',
    amount: '',
    invoice_number: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const submitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    claimForm.post('/payroll/reimbursement', {
      onSuccess: () => {
        swalSuccess('Pengajuan klaim berhasil dikirim');
        claimForm.reset();
      },
      onError: () => swalError('Gagal mengajukan klaim'),
    });
  };

  return (
    <AppLayout title="Penggajian & Reimbursement">
      <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">Penggajian, Kompensasi &amp; Reimbursement</h2>
            <p className="text-sm text-[#434654] mt-1">Kalkulasi gaji otomatis terintegrasi data absensi &amp; lembur M1 serta klaim biaya operasional amil</p>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-blue-100 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'payroll' ? 'border-[#0053d0] text-[#0053d0]' : 'border-transparent text-[#737686]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            Periode Penggajian &amp; Slip Gaji
          </button>
          <button
            onClick={() => setActiveTab('reimbursement')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'reimbursement' ? 'border-[#0053d0] text-[#0053d0]' : 'border-transparent text-[#737686]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Klaim Reimbursement
          </button>
          <button
            onClick={() => setActiveTab('komponen')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'komponen' ? 'border-[#0053d0] text-[#0053d0]' : 'border-transparent text-[#737686]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Komponen &amp; Tarif
          </button>
        </div>

        {/* Tab 1: Payroll */}
        {activeTab === 'payroll' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-[#0b1c30]">Daftar Periode Payroll Bulanan</h3>
                  <p className="text-xs text-[#737686]">Siklus: Draft → Review → Disetujui → Dikunci → Dibayar</p>
                </div>
                <button
                  onClick={() => router.post('/payroll/generate')}
                  className="px-4 py-2 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">calculate</span>
                  Hitung Payroll Bulan Ini
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9ff] text-[#737686] uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">Periode</th>
                      <th className="py-3 px-4">Total Amil</th>
                      <th className="py-3 px-4">Total Gaji Pokok &amp; Tunjangan</th>
                      <th className="py-3 px-4">Total Lembur</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {periods.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada periode penggajian yang diproses. Klik "Hitung Payroll Bulan Ini" untuk memulai kalkulasi otomatis dari data kehadiran.
                        </td>
                      </tr>
                    ) : (
                      periods.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-3 px-4 font-bold">{p.period_name}</td>
                          <td className="py-3 px-4">{p.total_employees} Amil</td>
                          <td className="py-3 px-4 font-bold text-[#0b1c30]">Rp {Number(p.total_gross || 0).toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-emerald-600 font-bold">Rp {Number(p.total_overtime || 0).toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0053d0]">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#0b1c30] rounded-lg font-bold">
                              Lihat Slip
                            </button>
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

        {/* Tab 2: Reimbursement */}
        {activeTab === 'reimbursement' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30]">Formulir Pengajuan Reimbursement</h3>
              <form onSubmit={submitClaim} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Kategori Klaim</label>
                  <select
                    value={claimForm.data.category}
                    onChange={(e) => claimForm.setData('category', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  >
                    <option value="Transport & Operasional Lapangan">Transport &amp; Operasional Lapangan</option>
                    <option value="Kunjungan Mitra / Muzaki">Kunjungan Mitra / Muzaki</option>
                    <option value="Kesehatan & Pengobatan">Kesehatan &amp; Pengobatan</option>
                    <option value="Konsumsi Kegiatan Program">Konsumsi Kegiatan Program</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={claimForm.data.amount}
                    onChange={(e) => claimForm.setData('amount', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="Contoh: 150000"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Nomor Kwitansi / Bukti</label>
                  <input
                    type="text"
                    required
                    value={claimForm.data.invoice_number}
                    onChange={(e) => claimForm.setData('invoice_number', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="Nomor struk/nota"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={claimForm.data.date}
                    onChange={(e) => claimForm.setData('date', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Keterangan / Keperluan</label>
                  <textarea
                    rows={2}
                    required
                    value={claimForm.data.description}
                    onChange={(e) => claimForm.setData('description', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="Keterangan tugas amil..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={claimForm.processing}
                  className="w-full py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Kirim Pengajuan Klaim
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30]">Daftar Klaim Reimbursement Amil</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9ff] text-[#737686] font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Amil</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Nominal</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {reimbursements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Belum ada pengajuan klaim reimbursement.
                        </td>
                      </tr>
                    ) : (
                      reimbursements.map((r: any) => (
                        <tr key={r.id}>
                          <td className="py-2.5 px-3 font-bold">{r.pegawai?.full_name || 'Amil'}</td>
                          <td className="py-2.5 px-3">{r.category}</td>
                          <td className="py-2.5 px-3 font-bold text-[#0b1c30]">Rp {Number(r.amount).toLocaleString('id-ID')}</td>
                          <td className="py-2.5 px-3 text-slate-500">{r.date}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {r.status}
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

        {/* Tab 3: Komponen Gaji */}
        {activeTab === 'komponen' && (
          <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4 animate-fade-in">
            <h3 className="font-bold text-sm text-[#0b1c30]">Aturan Tarif &amp; Komponen Payroll</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#f8f9ff] border border-blue-100 rounded-xl space-y-1">
                <span className="font-bold text-[#0053d0]">Tarif Lembur Standar (OT-02)</span>
                <p className="text-xl font-extrabold text-[#0b1c30]">Rp 10.000 / Jam</p>
                <p className="text-[11px] text-slate-500">Berlaku flat untuk Before Shift &amp; After Shift.</p>
              </div>
              <div className="p-4 bg-[#f8f9ff] border border-blue-100 rounded-xl space-y-1">
                <span className="font-bold text-[#0053d0]">Batas Lembur Bulanan (OT-03)</span>
                <p className="text-xl font-extrabold text-[#0b1c30]">40 Jam / Bulan</p>
                <p className="text-[11px] text-slate-500">Soft limit (dapat diajukan dengan peringatan ke atasan).</p>
              </div>
              <div className="p-4 bg-[#f8f9ff] border border-blue-100 rounded-xl space-y-1">
                <span className="font-bold text-[#0053d0]">Potongan Wajib (PAY-04)</span>
                <p className="text-xl font-extrabold text-[#0b1c30]">BPJS &amp; PPh 21</p>
                <p className="text-[11px] text-slate-500">Konfigurasi berversi sesuai ketentuan Keuangan.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
