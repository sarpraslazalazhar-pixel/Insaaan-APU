import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';

interface Props {
  status?: string;
  error?: string;
}

export const Login: React.FC<Props> = ({ status, error: initialError }) => {
  const { data, setData, post, processing, errors } = useForm({
    username: '',
    remember: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/login');
  };

  const errorMessage = initialError || errors.username;

  return (
    <div className="min-h-screen w-full flex bg-[#f8f9ff] relative overflow-hidden font-sans">
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-blue-200/20 blur-[120px] pointer-events-none"></div>

      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto md:p-6 lg:p-12 items-stretch justify-center relative z-10">

        <div className="hidden md:flex md:w-[45%] lg:w-[48%] bg-[#0053d0] rounded-[40px] shadow-2xl relative overflow-hidden flex-col justify-between p-12 text-white">
          <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shrink-0">
                <span className="font-sans text-xl font-bold text-[#0053d0]">IA</span>
              </div>
              <div>
                <h1 className="font-sans text-lg font-extrabold text-white leading-none tracking-tight">
                  Insaan APU<span className="text-[#b3c5ff]">.</span>
                </h1>
                <p className="font-sans text-[10px] text-white/70 mt-1 font-semibold uppercase tracking-widest">
                 Al Azhar Peduli
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <h2 className="font-sans text-3xl font-extrabold text-white leading-tight tracking-tight">
              Sistem Manajemen Insaan &amp; Amil Al Azhar
            </h2>
            <p className="font-sans text-sm text-[#b3c5ff] mt-4 leading-relaxed font-medium">
              Aplikasi penatausahaan kepegawaian yang amanah, profesional, transparan, dan terintegrasi penuh untuk kemaslahatan umat.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/60 font-semibold uppercase tracking-wider">
            Full Stack Monolith • Berbasis Sesi Aman
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12">
          <div className="w-full max-w-md bg-white rounded-[32px] p-8 md:p-10 border border-blue-50/50 shadow-xl shadow-blue-500/5 relative">

            <div className="flex items-center gap-3 mb-8 md:hidden">
              <div className="w-9 h-9 rounded-lg bg-[#0053d0] flex items-center justify-center shrink-0">
                <span className="font-sans text-lg font-bold text-white">IA</span>
              </div>
              <div>
                <h1 className="font-sans text-base font-extrabold text-[#0b1c30] leading-none tracking-tight">
                  Insaan APU
                </h1>
                <p className="font-sans text-[9px] text-[#737686] mt-0.5 font-bold uppercase tracking-widest">
                  Al Azhar Peduli
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-sans text-2xl font-extrabold text-[#0b1c30] tracking-tight">
                Masuk ke Akun
              </h2>
              <p className="font-sans text-xs text-[#737686] mt-1.5 font-semibold">
                Silakan masukkan NIP (ID Amil) atau email kantor Anda
              </p>
            </div>

            {status && (
              <div className="mb-5 p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
                {status}
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs text-[#0b1c30]">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#434654] uppercase tracking-wider">NIP / ID Amil / Username</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    className="w-full px-4 py-3 bg-[#f8f9ff] border border-blue-100 rounded-xl focus:border-[#0053d0] focus:bg-white outline-none font-medium text-sm tracking-wide transition-all"
                    placeholder="Contoh: 20103008013 atau email amil"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-[#434654] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                    className="w-4 h-4 rounded text-[#0053d0] border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <span>Ingat Saya</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 bg-[#0053d0] hover:bg-[#0043a8] text-white rounded-xl font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
