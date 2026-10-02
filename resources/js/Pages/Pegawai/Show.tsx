import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';

interface Props {
  pegawai: any;
}

export const Show: React.FC<Props> = ({ pegawai }) => {
  const pageProps = usePage().props as any;
  const sessionUser = pageProps.auth?.user;
  const isAdmin = sessionUser?.role?.name === 'super_admin' || sessionUser?.role?.name === 'admin_hr';

  const [activeSubTab, setActiveSubTab] = useState<
    'profil' | 'kepegawaian' | 'keluarga' | 'karir' | 'dokumen' | 'log'
  >('profil');

  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('KTP');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  if (!pegawai) {
    return (
      <AppLayout title="Detail Karyawan">
        <div className="bg-white rounded-[24px] p-8 text-center text-[#737686] shadow-sm border border-blue-50/50 py-16">
          <span className="text-3xl block mb-4">⚠️</span>
          <p className="text-[#0b1c30] font-bold text-sm">Data karyawan tidak ditemukan.</p>
          <Link
            href="/pegawai"
            className="mt-4 px-5 py-2.5 bg-[#0053d0] hover:bg-blue-700 transition-colors text-white rounded-full text-xs font-bold inline-block cursor-pointer"
          >
            Kembali ke Daftar
          </Link>
        </div>
      </AppLayout>
    );
  }

  const getInitials = (name: string) => {
    return (name || 'IA')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const calculateMasaKerja = (joinDateStr: string | null) => {
    if (!joinDateStr) return '-';
    const join = new Date(joinDateStr);
    const now = new Date();
    if (isNaN(join.getTime())) return '-';

    let years = now.getFullYear() - join.getFullYear();
    let months = now.getMonth() - join.getMonth();
    let days = now.getDate() - join.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} Tahun`);
    if (months > 0) parts.push(`${months} Bulan`);
    if (days > 0 || parts.length === 0) parts.push(`${days} Hari`);

    return parts.join(' ');
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', docFile);

    setIsUploadingDoc(true);
    router.post(`/pegawai/${pegawai.id}/documents`, formData, {
      onSuccess: () => {
        setDocFile(null);
        setIsUploadingDoc(false);
      },
      onError: () => {
        setIsUploadingDoc(false);
      },
    });
  };

  const handleDeleteDoc = (docId: number, typeTitle: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen ${typeTitle}?`)) {
      router.delete(`/pegawai/documents/${docId}`);
    }
  };

  const tabsList = [
    { id: 'profil', label: 'Profil' },
    { id: 'kepegawaian', label: 'Kepegawaian' },
    { id: 'keluarga', label: 'Keluarga' },
    { id: 'karir', label: 'Riwayat Karir' },
    { id: 'dokumen', label: `Dokumen (${pegawai.documents?.length || 0})` },
    { id: 'log', label: 'Log Perubahan' },
  ] as const;

  const empStatus = (pegawai.employment_status || 'KONTRAK').toUpperCase();

  return (
    <AppLayout title={`Detail: ${pegawai.full_name}`}>
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#737686] font-medium">
          <Link href="/pegawai" className="hover:text-[#0053d0] transition-colors cursor-pointer">
            Karyawan
          </Link>
          <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
          <span className="text-[#0b1c30] font-bold">{pegawai.full_name}</span>
        </div>

        {/* Large Profile Header Card with Pattern Banner */}
        <div className="bg-white rounded-[24px] shadow-sm mb-8 overflow-hidden relative border border-blue-50/50">
          <div className="h-32 bg-[#dae1ff]/30 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#0053d0 1.2px, transparent 1.2px)',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backgroundSize: '20px 20px',
              }}
            ></div>
          </div>

          <div className="px-8 pb-8 -mt-16 relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-end justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end w-full">
              <div className="w-[120px] h-[120px] rounded-[24px] border-[6px] border-white overflow-hidden bg-white shrink-0 shadow-sm flex items-center justify-center">
                <div className="w-full h-full bg-blue-50 text-[#0053d0] flex items-center justify-center font-bold text-3xl">
                  {getInitials(pegawai.full_name)}
                </div>
              </div>

              <div className="flex-1 w-full pb-2">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h2 className="font-sans text-2xl font-extrabold text-[#0b1c30]">
                    {pegawai.full_name}
                  </h2>

                  <span
                    className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                      empStatus === 'TETAP'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : empStatus === 'KONTRAK'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-slate-50 text-[#585f6a] border border-slate-100'
                    }`}
                  >
                    {pegawai.employment_status || 'Kontrak'}
                  </span>

                  <span className="px-3 py-1 bg-[#eff4ff] text-[#0053d0] rounded-full font-bold text-[10px] border border-blue-50">
                    Level {pegawai.level || (pegawai.position?.level || '5')}
                  </span>

                  {pegawai.is_field_staff && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full font-bold text-[10px] border border-amber-200">
                      Amil Lapangan
                    </span>
                  )}

                  {!pegawai.is_active && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold text-[10px] border border-red-200">
                      NONAKTIF
                    </span>
                  )}
                </div>

                <p className="font-sans text-base text-[#434654] font-medium mb-5">
                  {pegawai.position?.name || pegawai.current_position || 'Staf'} di {pegawai.org_unit?.name || pegawai.departement || 'Umum'}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-xs text-[#737686]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0053d0]/70 text-lg">badge</span>
                    <span className="font-bold text-[#0b1c30]">ID: {pegawai.employee_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0053d0]/70 text-lg">calendar_today</span>
                    <span>Bergabung {pegawai.join_date || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
              <Link
                href="/pegawai"
                className="flex-1 lg:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-full transition-colors flex items-center justify-center cursor-pointer"
              >
                Kembali
              </Link>
              {isAdmin && (
                <Link
                  href={`/pegawai/${pegawai.id}/edit`}
                  className="flex-1 lg:flex-initial bg-[#0053d0] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md shadow-blue-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Edit Profil
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Row Navigation */}
        <div className="bg-white rounded-[20px] shadow-sm overflow-x-auto scroll-hidden mb-8 border border-blue-50/50 p-2">
          <div className="flex min-w-max gap-1.5">
            {tabsList.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-[14px] font-sans text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-[#0053d0] text-white shadow-sm'
                    : 'text-[#737686] hover:text-[#0b1c30] hover:bg-blue-50/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: PROFIL & PENDIDIKAN */}
        {activeSubTab === 'profil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DATA PRIBADI & PENDIDIKAN CARD */}
            <div className="bg-white rounded-[24px] shadow-sm border border-blue-50/50 p-8 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#dae1ff]/20 rounded-bl-full pointer-events-none"></div>

              <h3 className="font-sans text-[10px] text-[#0053d0] font-bold uppercase tracking-wider bg-[#dae1ff]/50 inline-block self-start px-4 py-1.5 rounded-full relative z-10 mb-8">
                DATA PRIBADI &amp; PENDIDIKAN
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 relative z-10 text-xs">
                <div>
                  <p className="font-sans text-[#737686] font-medium mb-1">Tempat Lahir</p>
                  <p className="font-sans text-base text-[#0b1c30] font-extrabold">{pegawai.place_of_birth || '-'}</p>
                </div>
                <div>
                  <p className="font-sans text-[#737686] font-medium mb-1">Tanggal Lahir</p>
                  <p className="font-sans text-base text-[#0b1c30] font-extrabold">{pegawai.date_of_birth || '-'}</p>
                </div>
                <div>
                  <p className="font-sans text-[#737686] font-medium mb-1">Jenis Kelamin</p>
                  <p className="font-sans text-base text-[#0b1c30] font-extrabold">
                    {pegawai.gender === 'L' ? 'Laki-Laki' : pegawai.gender === 'P' ? 'Perempuan' : '-'}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-[#737686] font-medium mb-1">Status Pernikahan</p>
                  <p className="font-sans text-base text-[#0b1c30] font-extrabold">{pegawai.marital_status || '-'}</p>
                </div>

                {/* Pendidikan Terakhir Detail */}
                <div className="sm:col-span-2 pt-4 border-t border-blue-50">
                  <p className="font-sans text-[#737686] font-medium mb-1">Pendidikan Terakhir</p>
                  <p className="font-sans text-base text-[#0b1c30] font-extrabold">
                    {pegawai.education_level || '-'} {pegawai.institution_name ? `di ${pegawai.institution_name}` : ''}
                  </p>
                  {pegawai.institution_place && (
                    <p className="text-[#737686] text-xs mt-1">
                      {pegawai.institution_place} {pegawai.graduation_date ? `• Lulus: ${pegawai.graduation_date}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* KONTAK & IDENTITAS CARD */}
            <div className="bg-white rounded-[24px] shadow-sm border border-blue-50/50 p-8 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#eff4ff] rounded-bl-full pointer-events-none"></div>

              <h3 className="font-sans text-[10px] text-[#585f6a] font-bold uppercase tracking-wider bg-[#eff4ff] inline-block self-start px-4 py-1.5 rounded-full relative z-10 mb-8">
                KONTAK &amp; IDENTITAS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 relative z-10 text-xs">
                <div>
                  <p className="font-sans text-[#737686] font-medium mb-1">Nomor Telepon (WA)</p>
                  <p className="font-sans text-base text-[#0b1c30] font-extrabold">
                    {pegawai.mobile_phone_number || pegawai.mobile_phone || '-'}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-[#737686] font-medium mb-1">Email</p>
                  <p
                    className="font-sans text-sm text-[#0053d0] font-extrabold truncate"
                    title={pegawai.email || pegawai.email_kantor || pegawai.email_pribadi || ''}
                  >
                    {pegawai.email || pegawai.email_kantor || pegawai.email_pribadi || '-'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-sans text-[#737686] font-medium mb-1">NIK (KTP)</p>
                  <p className="font-sans text-base text-[#0b1c30] font-mono font-extrabold">{pegawai.nik || '-'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-sans text-[#737686] font-medium mb-1">Alamat Sesuai KTP</p>
                  <p className="font-sans text-sm text-[#0b1c30] font-medium leading-relaxed">
                    {pegawai.citizen_id_address || pegawai.nik_address || '-'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-sans text-[#737686] font-medium mb-1">Alamat Domisili</p>
                  <p className="font-sans text-sm text-[#0b1c30] font-medium leading-relaxed">
                    {pegawai.residential_address || pegawai.citizen_id_address || pegawai.nik_address || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: KEPEGAWAIAN */}
        {activeSubTab === 'kepegawaian' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[24px] shadow-sm border border-blue-50/50 p-8 space-y-8">
              <h3 className="font-sans text-[10px] text-[#0053d0] font-bold uppercase tracking-wider bg-[#dae1ff]/50 inline-block self-start px-4 py-1.5 rounded-full mb-2">
                POSISI &amp; JABATAN
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 text-xs">
                <div>
                  <p className="text-[#737686] font-medium mb-1">Departemen / Divisi</p>
                  <p className="text-base text-[#0b1c30] font-extrabold">
                    {pegawai.org_unit?.name || pegawai.departement || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[#737686] font-medium mb-1">Unit Kerja</p>
                  <p className="text-base text-[#0b1c30] font-extrabold">{pegawai.unit || '-'}</p>
                </div>
                <div>
                  <p className="text-[#737686] font-medium mb-1">Jabatan (Struktur)</p>
                  <p className="text-base text-[#0b1c30] font-extrabold">
                    {pegawai.position?.name || pegawai.current_position || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[#737686] font-medium mb-1">Level / Grade</p>
                  <p className="text-base text-[#0b1c30] font-extrabold">
                    Level {pegawai.level || (pegawai.position?.level || '-')} / {pegawai.job_level || 'Staf'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[#737686] font-medium mb-1">Atasan Langsung (Approval Line)</p>
                  <p className="text-base text-[#0053d0] font-extrabold">
                    {pegawai.manager ? `${pegawai.manager.full_name} (${pegawai.manager.employee_id})` : 'Tingkat Teratas / Direktur Utama'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-blue-50/50 p-8 space-y-8">
              <h3 className="font-sans text-[10px] text-[#0053d0] font-bold uppercase tracking-wider bg-[#dae1ff]/50 inline-block self-start px-4 py-1.5 rounded-full mb-2">
                MASA KERJA
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 text-xs">
                <div className="sm:col-span-2 p-5 bg-blue-50/40 rounded-2xl border border-blue-100/50">
                  <p className="text-[#737686] font-medium mb-1">Total Masa Kerja Auto-Hitung</p>
                  <p className="text-2xl text-[#0053d0] font-extrabold">{calculateMasaKerja(pegawai.join_date)}</p>
                </div>
                <div>
                  <p className="text-[#737686] font-medium mb-1">Tanggal Masuk (Join Date)</p>
                  <p className="text-base text-[#0b1c30] font-extrabold">{pegawai.join_date || '-'}</p>
                </div>
                <div>
                  <p className="text-[#737686] font-medium mb-1">Tanggal Kontrak Berakhir</p>
                  <p className="text-base text-[#0b1c30] font-extrabold">
                    {pegawai.employment_status === 'Kontrak' ? (pegawai.contract_end_date || '-') : 'Tidak Berlaku (Tetap)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: KELUARGA */}
        {activeSubTab === 'keluarga' && (
          <div className="bg-white rounded-[24px] shadow-sm border border-blue-50/50 p-8 space-y-6">
            <h3 className="font-sans text-sm font-bold text-[#0b1c30]">Data Anggota Keluarga / Tanggungan</h3>
            <p className="text-xs text-[#737686]">Diperlukan untuk keperluan administrasi BPJS dan tunjangan keluarga.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-blue-50 text-[#737686] font-bold uppercase tracking-wider bg-[#f8f9ff]/50">
                    <th className="px-6 py-4">Nama Anggota</th>
                    <th className="px-6 py-4">Hubungan</th>
                    <th className="px-6 py-4">Tanggal Lahir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/40 text-[#0b1c30]">
                  {pegawai.spouse_name && (
                    <tr className="hover:bg-[#eff4ff]/20 transition-all">
                      <td className="px-6 py-4 font-bold">{pegawai.spouse_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-[#eff4ff] text-[#0053d0] rounded-full font-bold text-[10px]">
                          Pasangan
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#737686]">{pegawai.spouse_dob || '-'}</td>
                    </tr>
                  )}
                  {pegawai.family_members &&
                    pegawai.family_members.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-[#eff4ff]/20 transition-all">
                        <td className="px-6 py-4 font-bold">{c.nama}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px]">
                            Anak ke-{c.urutan_anak || i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-[#737686]">{c.tanggal_lahir || '-'}</td>
                      </tr>
                    ))}
                  {!pegawai.spouse_name && (!pegawai.family_members || pegawai.family_members.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-[#737686]">
                        Belum ada data anggota keluarga tercatat di sistem.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: RIWAYAT KARIR TIMELINE */}
        {activeSubTab === 'karir' && (
          <div className="bg-white rounded-[24px] shadow-sm border border-blue-50/50 p-8 h-full space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-sans text-[10px] text-[#0053d0] font-bold uppercase tracking-wider bg-[#dae1ff]/50 inline-block px-4 py-1.5 rounded-full">
                TIMELINE RIWAYAT KARIR &amp; MUTASI
              </h3>
              <span className="text-xs font-bold text-[#0053d0] bg-blue-50 px-3 py-1 rounded-full">
                {pegawai.career_history?.length || 0} Riwayat Terdata
              </span>
            </div>

            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-blue-100">
              {pegawai.career_history && pegawai.career_history.length > 0 ? (
                pegawai.career_history.map((stage: any, idx: number) => {
                  const isCurrent = stage.is_current;
                  return (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-[39px] top-1 w-4 h-4 rounded-full border-2 border-white z-10 shadow-sm ${
                          isCurrent ? 'bg-[#0053d0] ring-4 ring-blue-100' : 'bg-[#c0c7d4]'
                        }`}
                      ></div>
                      <div
                        className={
                          isCurrent
                            ? 'bg-[#dae1ff]/20 p-5 rounded-[20px] border border-blue-100 inline-block w-full max-w-2xl'
                            : 'p-3 inline-block w-full max-w-2xl bg-white border border-slate-100 rounded-[20px] shadow-sm'
                        }
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-sans text-xs font-bold mb-1.5 ${isCurrent ? 'text-[#0053d0]' : 'text-[#737686]'}`}>
                              {isCurrent
                                ? stage.tanggal_mulai ? `Sejak ${stage.tanggal_mulai} (Posisi Saat Ini)` : 'Posisi Aktif Saat Ini'
                                : stage.tanggal_mulai && stage.tanggal_selesai
                                ? `${stage.tanggal_mulai} s/d ${stage.tanggal_selesai}`
                                : stage.tanggal_mulai
                                ? `Mulai ${stage.tanggal_mulai}`
                                : 'Periode Penugasan Terdahulu'}
                            </p>
                            <p className="font-sans text-lg font-extrabold text-[#0b1c30]">
                              {stage.jabatan}
                            </p>
                            <p className="font-sans text-xs font-medium text-[#737686] mt-1">
                              {[stage.departement, stage.unit].filter(Boolean).join(' • ') || stage.keterangan || 'Penugasan Internal'}
                            </p>
                          </div>
                          {isCurrent && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[#737686]">Belum ada riwayat karir tercatat.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: DOKUMEN PEGAWAI */}
        {activeSubTab === 'dokumen' && (
          <div className="bg-white rounded-[24px] shadow-sm border border-blue-50/50 p-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-sans text-[10px] text-[#0053d0] font-bold uppercase tracking-wider bg-[#dae1ff]/50 inline-block px-4 py-1.5 rounded-full">
                DOKUMEN PEGAWAI (HR-03)
              </h3>
            </div>

            {/* Upload Box */}
            {isAdmin && (
              <form onSubmit={handleUploadDoc} className="bg-[#f8f9ff] rounded-2xl border border-blue-100/50 p-6 space-y-4">
                <p className="font-bold text-xs text-[#0b1c30]">Upload Dokumen Baru</p>
                <div className="flex flex-col sm:flex-row gap-3 items-end text-xs">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-[#737686] uppercase tracking-wider mb-1.5">
                      Jenis Dokumen
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-[#0b1c30] focus:border-[#0053d0] outline-none cursor-pointer"
                    >
                      <option value="KTP">KTP</option>
                      <option value="Kartu Keluarga">Kartu Keluarga (KK)</option>
                      <option value="NPWP">NPWP</option>
                      <option value="Ijazah">Ijazah</option>
                      <option value="Transkrip Nilai">Transkrip Nilai</option>
                      <option value="Sertifikat">Sertifikat</option>
                      <option value="Surat Kontrak">Surat Kontrak</option>
                      <option value="SK Pengangkatan">SK Pengangkatan</option>
                      <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                      <option value="BPJS Ketenagakerjaan">BPJS Ketenagakerjaan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-[#737686] uppercase tracking-wider mb-1.5">
                      File (PDF/JPG/PNG, maks 5MB)
                    </label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2 text-xs text-[#0b1c30] focus:border-[#0053d0] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!docFile || isUploadingDoc}
                    className="shrink-0 px-6 py-2.5 bg-[#0053d0] hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-full shadow-sm transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    {isUploadingDoc ? 'Mengupload...' : 'Upload'}
                  </button>
                </div>
              </form>
            )}

            {/* Document Cards Grid */}
            {pegawai.documents && pegawai.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pegawai.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="bg-[#f8f9ff] rounded-2xl border border-blue-50 p-5 flex flex-col justify-between hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0053d0] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">
                          {doc.file_path?.endsWith('.pdf') ? 'picture_as_pdf' : 'image'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-[#0b1c30] truncate">{doc.document_type}</p>
                        <p className="text-[10px] text-[#737686] mt-0.5 truncate">{doc.original_name || doc.file_path?.split('/').pop()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-blue-50/50">
                      <p className="text-[10px] text-[#737686]">
                        {doc.created_at || doc.uploaded_at
                          ? new Date(doc.created_at || doc.uploaded_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/storage/${doc.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0053d0] hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Dokumen"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </a>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id, doc.document_type)}
                            className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-blue-50 text-[#0053d0] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl">folder_open</span>
                </div>
                <p className="text-xs text-[#737686] font-medium">Belum ada dokumen yang diupload untuk karyawan ini.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: LOG PERUBAHAN AUDIT */}
        {activeSubTab === 'log' && (
          <div className="bg-white rounded-[24px] shadow-sm border border-blue-50/50 p-16 text-center">
            <div className="w-16 h-16 bg-blue-50 text-[#0053d0] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">history</span>
            </div>
            <h3 className="font-sans text-lg font-extrabold text-[#0b1c30]">Log Audit Aktivitas Amil</h3>
            <p className="text-sm text-[#737686] mt-2 max-w-md mx-auto">
              Seluruh riwayat perubahan data, mutasi jabatan, pengajuan, dan persetujuan amil ini dicatat secara aman dalam sistem audit log.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Show;
