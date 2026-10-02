import React from "react";
import { Link, usePage, router } from '@inertiajs/react';
import { useUI } from '../../lib/UIContext';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, setSidebarOpen } = useUI();
  const pageProps = usePage().props as any;
  const { url } = usePage();
  const user = pageProps.auth?.user;
  const roleName = user?.role?.name || 'staf_viewer';

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard" },
    { id: "pegawai", label: "Karyawan (SDM)", icon: "badge", href: "/pegawai" },
    { id: "organisasi", label: "Struktur Organisasi", icon: "account_tree", href: "/organisasi" },
    { id: "import", label: "Import Data", icon: "upload_file", href: "/import" },
    { id: "kehadiran", label: "Kehadiran & Cuti", icon: "event_available", href: "/kehadiran" },
    { id: "payroll", label: "Gaji & Klaim", icon: "payments", href: "/payroll" },
    { id: "rekrutmen", label: "Rekrutmen (ATS)", icon: "person_add", href: "/rekrutmen" },
    { id: "approvals", label: "Persetujuan", icon: "fact_check", href: "/approvals" },
  ];

  // RBAC Access Matrix per PRD.md Section 2
  const allowedMenusByRole: Record<string, string[]> = {
    super_admin: ['dashboard', 'pegawai', 'organisasi', 'import', 'kehadiran', 'payroll', 'rekrutmen', 'approvals'],
    admin_hr: ['dashboard', 'pegawai', 'organisasi', 'import', 'kehadiran', 'rekrutmen', 'approvals'],
    finance: ['dashboard', 'payroll', 'kehadiran', 'approvals'],
    manager_divisi: ['dashboard', 'kehadiran', 'approvals', 'organisasi'],
    staf_viewer: ['dashboard', 'kehadiran', 'payroll'],
  };

  const allowedList = allowedMenusByRole[roleName] || allowedMenusByRole.staf_viewer;
  const visibleMenuItems = menuItems.filter((item) => allowedList.includes(item.id));

  const handleLogout = () => {
    router.post('/logout');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full flex flex-col z-40 w-[260px] bg-[#0053d0] shadow-lg shadow-blue-500/10 rounded-tr-[40px] rounded-br-[40px] overflow-hidden transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-col h-full relative z-10">
          <div className="px-8 py-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
                <span className="font-sans text-xl font-bold text-[#0053d0]">IA</span>
              </div>
              <div>
                <h1 className="font-sans text-xl font-extrabold text-white leading-none tracking-tight">
                  Insaan APU<span className="text-[#b3c5ff]">.</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-sans text-[10px] text-white/70 font-semibold uppercase tracking-wider">
                    {user?.role?.display_name || 'Amil'}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="lg:hidden text-white/70 hover:text-white p-1 rounded-full transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto scroll-hidden px-4 py-2 space-y-1.5">
            {visibleMenuItems.map((item) => {
              const isActive = url.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl font-sans text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white text-[#0053d0] shadow-md shadow-black/5"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${isActive ? "text-[#0053d0]" : "text-white/70"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl font-sans text-sm font-semibold text-rose-200 hover:bg-white/10 hover:text-rose-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
