import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { swalSuccess, swalError } from '../../lib/swal';

interface Vacancy {
  id: number;
  title: string;
  type: string;
  description: string;
  deadline: string;
}

interface Props {
  vacancies: Vacancy[];
}

export const Public: React.FC<Props> = ({ vacancies = [] }) => {
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  const { data, setData, post, processing, reset } = useForm({
    job_vacancy_id: '',
    name: '',
    email: '',
    phone: '',
    nik: '',
    cover_letter: '',
  });

  const handleApply = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setData('job_vacancy_id', String(vacancy.id));
  };

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    post('/karir/lamar', {
      onSuccess: () => {
        swalSuccess('Lamaran Berhasil Dikirim', 'Terima kasih telah mendaftar. Tim HR Al Azhar Peduli akan segera meninjau berkas Anda.');
        setSelectedVacancy(null);
        reset();
      },
      onError: () => swalError('Gagal mengirim lamaran. Pastikan data terisi dengan benar.'),
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-blue-50/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0053d0] flex items-center justify-center text-white font-extrabold text-lg shadow-md">
              IA
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0053d0] tracking-tight leading-none">
                Insaan APU<span className="text-[#b3c5ff]">.</span>
              </h1>
              <p className="text-[10px] text-[#737686] uppercase font-bold tracking-widest mt-0.5">
                Portal Karir Al Azhar Peduli
              </p>
            </div>
          </div>
          <a
            href="/login"
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#0053d0] font-bold text-xs rounded-xl transition-colors"
          >
            Masuk Amil / Staf
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#0053d0] to-blue-700 text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Bergabung Bersama Kami Menjadi Amil &amp; Nadzhir Profesional
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Wujudkan pengabdian terbaik untuk kemaslahatan ummat melalui pengelolaan zakat, infak, sedekah, dan wakaf yang amanah dan transparan.
          </p>
        </div>
      </section>

      {/* Main Vacancies List */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h3 className="text-2xl font-extrabold text-[#0b1c30]">Lowongan Tersedia</h3>
          <p className="text-xs text-[#737686] mt-1">Pilih posisi yang sesuai dengan keahlian dan panggilan jiwa Anda</p>
        </div>

        {vacancies.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-blue-50/50 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-blue-200">work_off</span>
            <p className="font-bold text-base text-[#0b1c30] mt-3">Saat ini belum ada lowongan dibuka</p>
            <p className="text-xs text-[#737686] mt-1">Silakan kunjungi kembali halaman ini di waktu mendatang.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vacancies.map((v) => (
              <div
                key={v.id}
                className="bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-blue-50 text-[#0053d0] font-bold text-[10px] rounded-lg">
                      {v.type}
                    </span>
                    <span className="text-[11px] text-slate-400">Batas: {v.deadline}</span>
                  </div>
                  <h4 className="font-extrabold text-lg text-[#0b1c30] leading-snug">{v.title}</h4>
                  <p className="text-xs text-[#434654] line-clamp-3 leading-relaxed">
                    {v.description || 'Posisi amil di Al Azhar Peduli untuk mendukung program pemberdayaan dan penghimpunan.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <button
                    onClick={() => handleApply(v)}
                    className="w-full py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
                  >
                    Lamar Posisi Ini
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form Lamaran */}
        {selectedVacancy && (
          <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-[#0053d0] uppercase tracking-wider">Formulir Lamaran</span>
                  <h3 className="text-xl font-extrabold text-[#0b1c30]">{selectedVacancy.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedVacancy(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={submitApplication} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="Sesuai KTP"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">NIK (KTP) *</label>
                  <input
                    type="text"
                    required
                    value={data.nik}
                    onChange={(e) => setData('nik', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="16 digit NIK untuk verifikasi unik"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="nama@email.com"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Nomor WhatsApp / HP *</label>
                  <input
                    type="text"
                    required
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="0812xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Motivasi &amp; Pengantar Lamaran</label>
                  <textarea
                    rows={3}
                    value={data.cover_letter}
                    onChange={(e) => setData('cover_letter', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none"
                    placeholder="Ceritakan pengalaman dan motivasi Anda mendaftar..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedVacancy(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-2 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {processing ? 'Mengirim...' : 'Kirim Lamaran'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Public;
