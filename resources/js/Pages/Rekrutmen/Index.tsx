import React, { useState } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';
import { swalSuccess, swalError, swalConfirm } from '../../lib/swal';

interface Vacancy {
  id: number;
  title: string;
  type: string;
  status: string;
  target_hires: number;
  deadline: string;
  description?: string;
  candidates_count?: number;
}

interface Candidate {
  id: number;
  job_vacancy_id: number;
  name: string;
  email: string;
  phone: string;
  current_stage: string;
  created_at: string;
}

interface Props {
  vacancies: Vacancy[];
  candidates: Candidate[];
  mpp: any[];
}

const STAGES = [
  'Pelamar',
  'Seleksi Berkas',
  'Tes & Assessment',
  'Wawancara',
  'Penawaran',
  'Diterima',
  'Ditolak'
];

export const Index: React.FC<Props> = ({ vacancies = [], candidates = [], mpp = [] }) => {
  const [activeTab, setActiveTab] = useState<'ats' | 'lowongan' | 'mpp'>('ats');
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('');

  // Form Buat Lowongan
  const vacancyForm = useForm({
    title: '',
    type: 'Purna Waktu',
    status: 'Terbuka',
    target_hires: 1,
    deadline: '',
    description: '',
    requirements: '',
  });

  const submitVacancy = (e: React.FormEvent) => {
    e.preventDefault();
    vacancyForm.post('/rekrutmen/lowongan', {
      onSuccess: () => {
        swalSuccess('Lowongan berhasil dipublikasikan');
        vacancyForm.reset();
      },
      onError: () => swalError('Gagal membuat lowongan'),
    });
  };

  const updateStage = (candidateId: number, nextStage: string) => {
    router.put(`/rekrutmen/kandidat/${candidateId}/stage`, { stage: nextStage }, {
      onSuccess: () => swalSuccess(`Status dipindahkan ke ${nextStage}`),
      onError: () => swalError('Gagal memindahkan tahapan kandidat'),
    });
  };

  const convertToEmployee = (candidateId: number, candidateName: string) => {
    swalConfirm({
      title: 'Onboarding Karyawan?',
      text: `Konversi kandidat ${candidateName} menjadi data amil / karyawan resmi di sistem?`,
      confirmText: 'Ya, Konversi ke Pegawai',
    }).then((res) => {
      if (res.isConfirmed) {
        router.post(`/rekrutmen/kandidat/${candidateId}/onboard`, {}, {
          onSuccess: () => swalSuccess(`${candidateName} berhasil ditambahkan ke database amil!`),
          onError: () => swalError('Gagal melakukan onboarding'),
        });
      }
    });
  };

  const filteredCandidates = selectedVacancyId
    ? candidates.filter((c) => String(c.job_vacancy_id) === String(selectedVacancyId))
    : candidates;

  return (
    <AppLayout title="Akuisisi SDM & Rekrutmen (ATS)">
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">Akuisisi SDM &amp; Rekrutmen Amil</h2>
            <p className="text-sm text-[#434654] mt-1">Kelola Manpower Planning (MPP), lowongan, dan pelacakan pipeline kandidat (ATS)</p>
          </div>
          <a
            href="/karir"
            target="_blank"
            rel="noreferrer"
            className="bg-white hover:bg-slate-50 border border-slate-200 text-[#0053d0] font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm self-start"
          >
            <span className="material-symbols-outlined text-lg">open_in_new</span>
            Buka Portal Karir Publik
          </a>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-blue-100 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('ats')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'ats' ? 'border-[#0053d0] text-[#0053d0]' : 'border-transparent text-[#737686]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">view_kanban</span>
            Pipeline ATS Kandidat
          </button>
          <button
            onClick={() => setActiveTab('lowongan')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'lowongan' ? 'border-[#0053d0] text-[#0053d0]' : 'border-transparent text-[#737686]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            Kelola Lowongan
          </button>
          <button
            onClick={() => setActiveTab('mpp')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'mpp' ? 'border-[#0053d0] text-[#0053d0]' : 'border-transparent text-[#737686]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            Manpower Planning (MPP)
          </button>
        </div>

        {/* Tab 1: ATS Kanban Board */}
        {activeTab === 'ats' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-blue-50/50 shadow-sm">
              <span className="text-xs font-bold text-[#434654]">Filter Lowongan:</span>
              <select
                value={selectedVacancyId}
                onChange={(e) => setSelectedVacancyId(e.target.value)}
                className="px-3 py-1.5 bg-[#f8f9ff] border border-blue-100 rounded-lg text-xs font-semibold outline-none"
              >
                <option value="">Semua Posisi Lowongan</option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-4 scroll-hidden">
              {STAGES.map((stage) => {
                const stageCandidates = filteredCandidates.filter((c) => (c.current_stage || 'Pelamar') === stage);
                return (
                  <div key={stage} className="min-w-[260px] max-w-[280px] bg-slate-100/70 p-3 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-bold text-xs text-[#0b1c30]">{stage}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white rounded-full text-[#0053d0] shadow-sm">
                        {stageCandidates.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] scroll-hidden">
                      {stageCandidates.map((cand) => (
                        <div key={cand.id} className="bg-white p-3.5 rounded-xl border border-blue-50/50 shadow-sm space-y-2">
                          <p className="font-bold text-xs text-[#0b1c30]">{cand.name}</p>
                          <p className="text-[11px] text-[#737686]">{cand.email}</p>
                          <p className="text-[10px] text-slate-400">{cand.phone}</p>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            {stage === 'Diterima' ? (
                              <button
                                onClick={() => convertToEmployee(cand.id, cand.name)}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                                Onboard ke Pegawai
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 w-full justify-end">
                                {stage !== 'Ditolak' && (
                                  <button
                                    onClick={() => updateStage(cand.id, 'Ditolak')}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                    title="Tolak"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const nextIdx = Math.min(STAGES.indexOf(stage) + 1, STAGES.length - 2);
                                    updateStage(cand.id, STAGES[nextIdx]);
                                  }}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#0053d0] rounded font-bold text-[10px]"
                                >
                                  Lanjut Tahap
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Lowongan */}
        {activeTab === 'lowongan' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30]">Publikasi Lowongan Baru</h3>
              <form onSubmit={submitVacancy} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Judul Posisi Lowongan</label>
                  <input
                    type="text"
                    required
                    value={vacancyForm.data.title}
                    onChange={(e) => vacancyForm.setData('title', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="Contoh: Amil Fundraising Digital"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[#434654] block mb-1">Tipe</label>
                    <select
                      value={vacancyForm.data.type}
                      onChange={(e) => vacancyForm.setData('type', e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    >
                      <option value="Purna Waktu">Purna Waktu</option>
                      <option value="Kontrak Proyek">Kontrak Proyek</option>
                      <option value="Relawan">Relawan</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-[#434654] block mb-1">Target Kuota</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={vacancyForm.data.target_hires}
                      onChange={(e) => vacancyForm.setData('target_hires', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Batas Waktu Lamaran</label>
                  <input
                    type="date"
                    required
                    value={vacancyForm.data.deadline}
                    onChange={(e) => vacancyForm.setData('deadline', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Deskripsi &amp; Tugas</label>
                  <textarea
                    rows={3}
                    value={vacancyForm.data.description}
                    onChange={(e) => vacancyForm.setData('description', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={vacancyForm.processing}
                  className="w-full py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Terbitkan Lowongan
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30]">Daftar Lowongan Aktif</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9ff] text-[#737686] font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Posisi</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Target</th>
                      <th className="py-2.5 px-3">Batas Akhir</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {vacancies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Belum ada lowongan terdaftar.
                        </td>
                      </tr>
                    ) : (
                      vacancies.map((v) => (
                        <tr key={v.id}>
                          <td className="py-2.5 px-3 font-bold">{v.title}</td>
                          <td className="py-2.5 px-3">{v.type}</td>
                          <td className="py-2.5 px-3">{v.target_hires} Orang</td>
                          <td className="py-2.5 px-3 text-slate-500">{v.deadline}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {v.status}
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

        {/* Tab 3: MPP */}
        {activeTab === 'mpp' && (
          <div className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm space-y-4 animate-fade-in">
            <h3 className="font-bold text-sm text-[#0b1c30]">Manpower Planning (MPP) &amp; Job Requests</h3>
            <p className="text-xs text-[#737686]">Permintaan penambahan tenaga kerja oleh kepala divisi sebelum lowongan diterbitkan.</p>
            <div className="p-4 bg-[#f8f9ff] border border-blue-100 rounded-xl text-xs space-y-2">
              <p className="font-bold text-[#0053d0]">Alur Permintaan Tenaga Kerja (REC-01):</p>
              <p className="text-slate-600">
                1. Kepala Divisi mengajukan Job Request via MPP.<br />
                2. Admin HR / Direksi meninjau ketersediaan anggaran dan beban kerja.<br />
                3. Setelah disetujui, lowongan otomatis dibuat dan siap dipublikasikan ke publik.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
