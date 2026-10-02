import React, { useState } from "react";
import { usePage, router } from '@inertiajs/react';
import { useUI } from '../../lib/UIContext';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { setSidebarOpen } = useUI();
  const pageProps = usePage().props as any;
  const user = pageProps.auth?.user;

  const adminName = user?.full_name || user?.username || "Admin";
  const adminRole = user?.role?.display_name || user?.role_name || "Staf";
  const adminAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=0053d0&color=fff`;

  const handleLogout = () => {
    router.post('/logout');
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[260px] h-[80px] flex justify-between items-center px-4 lg:px-10 z-30 bg-white/80 backdrop-blur-md border-b border-blue-50/50 shadow-sm shadow-blue-100/10 transition-all duration-300">
      <div className="flex items-center gap-4 lg:gap-6 flex-1 max-w-xl">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-[#0b1c30] p-2 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div className="text-xl font-bold text-[#0053d0] hidden lg:block mr-2 shrink-0">
          {title}
        </div>

        <div className="relative w-full hidden sm:block">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737686]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-2.5 bg-[#f8f9ff] border border-transparent focus:border-[#0053d0]/30 focus:bg-white rounded-full font-sans text-sm text-[#0b1c30] placeholder-[#737686]/60 transition-all duration-200 outline-none"
            placeholder="Cari data amil, permohonan..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-[#737686] hover:text-[#0053d0] hover:bg-[#eff4ff] rounded-full p-2.5 transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 w-[320px] bg-white rounded-2xl shadow-xl border border-blue-50 p-4 z-50">
              <div className="flex justify-between items-center pb-2 border-b border-blue-50">
                <span className="font-bold text-sm text-[#0b1c30]">Notifikasi</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-[#0053d0] hover:underline cursor-pointer"
                >
                  Tutup
                </button>
              </div>
              <div className="py-4 text-center text-xs text-[#737686]">
                Belum ada notifikasi baru.
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 hover:bg-[#eff4ff] rounded-full sm:rounded-2xl transition-colors cursor-pointer"
          >
            <img
              src={adminAvatar}
              alt={adminName}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <div className="hidden md:flex flex-col items-start pr-2">
              <span className="text-sm font-bold text-[#0b1c30] leading-tight">{adminName}</span>
              <span className="text-xs text-[#737686] capitalize">{adminRole}</span>
            </div>
            <span className="material-symbols-outlined text-[#737686] hidden md:block text-xl">expand_more</span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-xl border border-blue-50 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-blue-50/50">
                <p className="text-xs text-[#737686]">Masuk sebagai</p>
                <p className="text-sm font-bold text-[#0b1c30] truncate">{adminName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
