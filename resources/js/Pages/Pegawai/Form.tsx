import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';

interface Props {
  pegawai?: any;
  isEdit?: boolean;
  orgUnits?: any[];
  positions?: any[];
  managers?: any[];
}

export const Form: React.FC<Props> = ({ pegawai, isEdit = false, orgUnits = [], positions = [], managers = [] }) => {
  const { data, setData, post, put, processing, errors } = useForm({
    employee_id: pegawai?.employee_id || '',
    full_name: pegawai?.full_name || '',
    nik: pegawai?.nik || '',
    email: pegawai?.email || pegawai?.email_kantor || '',
    mobile_phone_number: pegawai?.mobile_phone_number || pegawai?.mobile_phone || '',
    employment_status: pegawai?.employment_status || 'Tetap',
    current_position: pegawai?.current_position || '',
    departement: pegawai?.departement || '',
    unit: pegawai?.unit || '',
    unit_id: pegawai?.unit_id || '',
    position_id: pegawai?.position_id || '',
    manager_id: pegawai?.manager_id || '',
    is_field_staff: pegawai ? Boolean(pegawai.is_field_staff) : false,
    job_level: pegawai?.job_level || 'Staf',
    gender: pegawai?.gender || 'L',
    place_of_birth: pegawai?.place_of_birth || '',
    date_of_birth: pegawai?.date_of_birth || '',
    join_date: pegawai?.join_date || new Date().toISOString().slice(0, 10),
    contract_end_date: pegawai?.contract_end_date || '',
    marital_status: pegawai?.marital_status || 'Belum Menikah',
    spouse_name: pegawai?.spouse_name || '',
    spouse_dob: pegawai?.spouse_dob || '',
    citizen_id_address: pegawai?.citizen_id_address || pegawai?.nik_address || '',
    residential_address: pegawai?.residential_address || pegawai?.citizen_id_address || pegawai?.nik_address || '',
    is_active: pegawai ? pegawai.is_active : true,
    children: (pegawai?.family_members || []).map((c: any) => ({
      nama: c.nama,
      dob: c.tanggal_lahir,
    })),
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const addChild = () => {
    setData('children', [...data.children, { nama: '', dob: '' }]);
  };

  const removeChild = (index: number) => {
    const updated = [...data.children];
    updated.splice(index, 1);
    setData('children', updated);
  };

  const updateChild = (index: number, field: 'nama' | 'dob', val: string) => {
    const updated = [...data.children];
    updated[index][field] = val;
    setData('children', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      put(`/pegawai/${pegawai.id}`);
    } else {
      post('/pegawai');
    }
  };

  return (
    <AppLayout title={isEdit ? `Edit Data: ${pegawai?.full_name}` : 'Tambah Karyawan'}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0b1c30]">
              {isEdit ? 'Ubah Data Amil / Karyawan' : 'Form Pendaftaran Amil / Karyawan Baru'}
            </h2>
            <p className="text-xs text-[#737686] mt-1">Lengkapi data pribadi, kepegawaian, dan keluarga</p>
          </div>
          <Link
            href="/pegawai"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex bg-white p-2 rounded-2xl border border-blue-50/50 shadow-sm text-xs font-bold gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              step === 1 ? 'bg-[#0053d0] text-white shadow-sm' : 'text-[#737686] hover:bg-slate-50'
            }`}
          >
            <span>1. Data Pribadi</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              step === 2 ? 'bg-[#0053d0] text-white shadow-sm' : 'text-[#737686] hover:bg-slate-50'
            }`}
          >
            <span>2. Kepegawaian &amp; Posisi</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex-1 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              step === 3 ? 'bg-[#0053d0] text-white shadow-sm' : 'text-[#737686] hover:bg-slate-50'
            }`}
          >
            <span>3. Keluarga &amp; Tanggungan</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-blue-50/50 shadow-sm space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30] border-b border-blue-50 pb-2">Informasi Diri</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={data.full_name}
                    onChange={(e) => setData('full_name', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                    placeholder="Nama lengkap amil"
                  />
                  {errors.full_name && <p className="text-rose-500 text-[11px] mt-1">{errors.full_name}</p>}
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">NIK (KTP) *</label>
                  <input
                    type="text"
                    value={data.nik}
                    onChange={(e) => setData('nik', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                    placeholder="16 digit nomor induk kependudukan"
                  />
                  {errors.nik && <p className="text-rose-500 text-[11px] mt-1">{errors.nik}</p>}
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Email</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                    placeholder="email@alazhar.or.id"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">No. Handphone / WhatsApp</label>
                  <input
                    type="text"
                    value={data.mobile_phone_number}
                    onChange={(e) => setData('mobile_phone_number', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                    placeholder="0812xxxxxxxx"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Jenis Kelamin</label>
                  <select
                    value={data.gender}
                    onChange={(e) => setData('gender', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Status Pernikahan</label>
                  <select
                    value={data.marital_status}
                    onChange={(e) => setData('marital_status', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  >
                    <option value="Belum Menikah">Belum Menikah</option>
                    <option value="Menikah">Menikah</option>
                    <option value="Duda/Janda">Duda/Janda</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={data.place_of_birth}
                    onChange={(e) => setData('place_of_birth', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={data.date_of_birth}
                    onChange={(e) => setData('date_of_birth', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="font-bold text-[#434654] block mb-1">Alamat Sesuai KTP</label>
                  <textarea
                    rows={2}
                    value={data.citizen_id_address}
                    onChange={(e) => setData('citizen_id_address', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30] border-b border-blue-50 pb-2">Status &amp; Penugasan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">ID Karyawan (NIP) *</label>
                  <input
                    type="text"
                    required
                    disabled={isEdit}
                    value={data.employee_id}
                    onChange={(e) => setData('employee_id', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none disabled:opacity-60"
                    placeholder="Contoh: AMIL-001"
                  />
                  {errors.employee_id && <p className="text-rose-500 text-[11px] mt-1">{errors.employee_id}</p>}
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Status Kepegawaian *</label>
                  <select
                    value={data.employment_status}
                    onChange={(e) => setData('employment_status', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Relawan">Relawan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Jabatan Saat Ini</label>
                  <input
                    type="text"
                    value={data.current_position}
                    onChange={(e) => setData('current_position', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                    placeholder="Contoh: Staf Fundraising"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Job Level</label>
                  <select
                    value={data.job_level}
                    onChange={(e) => setData('job_level', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  >
                    <option value="Direktur Utama">Direktur Utama</option>
                    <option value="Kepala Divisi">Kepala Divisi</option>
                    <option value="Manager">Manager</option>
                    <option value="Koordinator">Koordinator</option>
                    <option value="Staf">Staf</option>
                    <option value="Relawan">Relawan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Departemen / Divisi</label>
                  <input
                    type="text"
                    value={data.departement}
                    onChange={(e) => setData('departement', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                    placeholder="Contoh: Pendistribusian &amp; Pendayagunaan"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Unit Kerja</label>
                  <input
                    type="text"
                    value={data.unit}
                    onChange={(e) => setData('unit', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                    placeholder="Contoh: Kantor Pusat Jakarta"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Struktur Unit Organisasi</label>
                  <select
                    value={data.unit_id}
                    onChange={(e) => setData('unit_id', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  >
                    <option value="">-- Pilih Unit Organisasi --</option>
                    {orgUnits.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.type !== 'formal' ? '[Satgas/Ad-Hoc]' : ''} ({u.code || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Master Jabatan</label>
                  <select
                    value={data.position_id}
                    onChange={(e) => setData('position_id', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  >
                    <option value="">-- Pilih Master Jabatan --</option>
                    {positions.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.level ? `(Level ${p.level})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Atasan Langsung (Approval Line)</label>
                  <select
                    value={data.manager_id}
                    onChange={(e) => setData('manager_id', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  >
                    <option value="">-- Tanpa Atasan / Tingkat Teratas --</option>
                    {managers.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.is_field_staff}
                      onChange={(e) => setData('is_field_staff', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0053d0]"></div>
                  </label>
                  <div>
                    <span className="font-bold text-xs text-[#0b1c30] block">Amil / Karyawan Lapangan</span>
                    <span className="text-[11px] text-[#737686]">Aktifkan fitur pelacakan lokasi GPS saat bertugas</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tanggal Bergabung *</label>
                  <input
                    type="date"
                    required
                    value={data.join_date}
                    onChange={(e) => setData('join_date', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tanggal Akhir Kontrak (Opsional)</label>
                  <input
                    type="date"
                    value={data.contract_end_date}
                    onChange={(e) => setData('contract_end_date', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#0b1c30] border-b border-blue-50 pb-2">Keluarga &amp; Tanggungan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Nama Pasangan</label>
                  <input
                    type="text"
                    value={data.spouse_name}
                    onChange={(e) => setData('spouse_name', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Tgl Lahir Pasangan</label>
                  <input
                    type="date"
                    value={data.spouse_dob}
                    onChange={(e) => setData('spouse_dob', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:bg-white focus:border-[#0053d0] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-blue-50">
                <h4 className="font-bold text-xs text-[#0b1c30]">Data Anak</h4>
                <button
                  type="button"
                  onClick={addChild}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#0053d0] font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Tambah Anak
                </button>
              </div>

              {data.children.map((child: any, idx: number) => (
                <div key={idx} className="flex gap-3 items-center bg-[#f8f9ff] p-3 rounded-xl border border-blue-50 text-xs">
                  <span className="font-bold text-[#0053d0] w-16">Anak #{idx + 1}</span>
                  <input
                    type="text"
                    placeholder="Nama anak"
                    value={child.nama}
                    onChange={(e) => updateChild(idx, 'nama', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-blue-100 rounded-lg outline-none"
                  />
                  <input
                    type="date"
                    value={child.dob}
                    onChange={(e) => updateChild(idx, 'dob', e.target.value)}
                    className="px-3 py-2 bg-white border border-blue-100 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeChild(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-blue-50">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as any)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Sebelumnya
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((step + 1) as any)}
                  className="px-6 py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Selanjutnya
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={processing}
                  className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? 'Menyimpan...' : (isEdit ? 'Perbarui Data' : 'Simpan Karyawan')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default Form;
