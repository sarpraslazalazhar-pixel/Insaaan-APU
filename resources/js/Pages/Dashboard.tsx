import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AppLayout } from '../Layouts/AppLayout';
import { swalInfo } from '../lib/swal';

interface Props {
  stats: any;
}

export const Dashboard: React.FC<Props> = ({ stats }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const pageProps = usePage().props as any;
  const user = pageProps.auth?.user;

  const totalCount = stats?.total_active || 0;
  const tetapCount = stats?.total_tetap || 0;
  const kontrakCount = stats?.total_kontrak || 0;
  const relawanCount = stats?.total_relawan || 0;

  const maleCount = stats?.gender_male || 0;
  const femaleCount = stats?.gender_female || 0;
  const totalGender = maleCount + femaleCount;
  const malePercentage = totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 0;
  const femalePercentage = totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 0;

  const alerts = [
    { id: "alert-1", type: "contracts", title: "Kontrak Berakhir", subtitle: "dalam 30 Hari", count: stats?.kontrak_expiring_30_days || 0, icon: "event_busy", href: "/pegawai?quickFilter=EXPIRING" },
    { id: "alert-2", type: "birthdays", title: "Ulang Tahun", subtitle: "Bulan Ini", count: stats?.birthdays_this_month || 0, icon: "cake", href: "/pegawai" },
    { id: "alert-3", type: "probation", title: "Masa Percobaan", subtitle: "Berakhir dlm 3 Bln", count: stats?.probation_expiring || 0, icon: "how_to_reg", href: "/pegawai" },
  ];

  const divisions = Object.entries(stats?.divisions || {}).map(([name, count]) => ({
    name: name as string,
    count: count as number,
  })).sort((a, b) => b.count - a.count);

  const maxDivCount = divisions.length > 0 ? Math.max(...divisions.map(d => d.count), 1) : 1;
  const divColors = ['bg-[#0053d0]', 'bg-[#585f6a]', 'bg-emerald-600', 'bg-[#326deb]', 'bg-[#737686]', 'bg-purple-600', 'bg-orange-500', 'bg-indigo-500'];

  const levels = Object.entries(stats?.levels || {}).map(([lvl, count]) => ({
    lvl: lvl as string,
    count: count as number,
  })).sort((a, b) => b.count - a.count);

  const recentJoins = stats?.recent_joins || [];
  const chartData = stats?.chart_data || [{ month: "-", value: 0, heightPct: 0 }];
  const activities = stats?.activities || [];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Top Banner & Header */}
        <div className="bg-gradient-to-r from-[#0053d0] to-blue-700 rounded-[24px] p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none mix-blend-overlay"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Assalamu'alaikum, {user?.full_name || 'Admin'}
              </h2>
              <p className="text-blue-100 mt-2 font-medium">Ringkasan data kepegawaian Insan Al Azhar Peduli hari ini.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pegawai/create"
                className="bg-white text-[#0053d0] hover:bg-blue-50 font-semibold text-xs px-5 py-3 rounded-full shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Tambah Karyawan
              </Link>
            </div>
          </div>
        </div>

        {/* Row 1: Stat Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 hover:shadow-md border border-blue-50/40 transition-all duration-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-[#0053d0]">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-600 font-bold text-[10px] tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> Aktif
              </span>
            </div>
            <div className="mt-5">
              <h3 className="font-sans text-xs font-semibold text-[#434654] uppercase tracking-wider">Total Aktif</h3>
              <p className="font-sans text-4xl font-extrabold text-[#0b1c30] mt-1">{totalCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 hover:shadow-md border border-blue-50/40 transition-all duration-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#585f6a]/10 flex items-center justify-center text-[#585f6a]">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
            </div>
            <div className="mt-5">
              <h3 className="font-sans text-xs font-semibold text-[#434654] uppercase tracking-wider">Karyawan Tetap</h3>
              <p className="font-sans text-4xl font-extrabold text-[#0b1c30] mt-1">{tetapCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 hover:shadow-md border border-blue-50/40 transition-all duration-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined text-2xl">assignment_ind</span>
              </div>
            </div>
            <div className="mt-5">
              <h3 className="font-sans text-xs font-semibold text-[#434654] uppercase tracking-wider">Karyawan Kontrak</h3>
              <p className="font-sans text-4xl font-extrabold text-[#0b1c30] mt-1">{kontrakCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 hover:shadow-md border border-blue-50/40 transition-all duration-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
              </div>
            </div>
            <div className="mt-5">
              <h3 className="font-sans text-xs font-semibold text-[#434654] uppercase tracking-wider">Relawan</h3>
              <p className="font-sans text-4xl font-extrabold text-[#0b1c30] mt-1">{relawanCount}</p>
            </div>
          </div>
        </div>

        {/* Row 2: Alerts & Quick Notification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 border border-blue-50/40 hover:shadow-md transition-all duration-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0053d0]">
                  <span className="material-symbols-outlined text-2xl">{alert.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0b1c30]">{alert.title}</h4>
                  <p className="text-xs text-[#737686]">{alert.subtitle}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-[#0053d0]">{alert.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart: Tren Ketidakhadiran */}
          <div className="lg:col-span-2 bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 border border-blue-50/40">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-base text-[#0b1c30]">Tren Ketidakhadiran Amil (6 Bulan Terakhir)</h3>
                <p className="text-xs text-[#737686] mt-0.5">Izin, cuti, sakit, dan tanpa keterangan</p>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-4 pt-10 px-4">
              {chartData.map((d: any, idx: number) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 group relative"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {hoveredPoint === idx && (
                    <div className="absolute -top-9 bg-[#0b1c30] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md z-10 animate-fade-in">
                      {d.value} hari absen
                    </div>
                  )}
                  <div className="w-full max-w-[48px] bg-blue-50 rounded-t-xl h-48 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-[#0053d0] group-hover:bg-blue-700 transition-all rounded-t-xl duration-500"
                      style={{ height: `${Math.max(d.heightPct || 10, 8)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-[#737686]">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Ratio */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 border border-blue-50/40 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-[#0b1c30]">Komposisi Gender</h3>
              <p className="text-xs text-[#737686] mt-0.5">Perbandingan amil Laki-laki vs Perempuan</p>

              <div className="mt-8 space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-blue-700">Laki-laki ({maleCount})</span>
                    <span>{malePercentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0053d0] rounded-full" style={{ width: `${malePercentage}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-pink-600">Perempuan ({femaleCount})</span>
                    <span>{femalePercentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-pink-50 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${femalePercentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-blue-50/50 mt-6 flex justify-between text-xs text-[#737686]">
              <span>Total Terdata:</span>
              <span className="font-bold text-[#0b1c30]">{totalGender} Orang</span>
            </div>
          </div>
        </div>

        {/* Row 4: Divisi Breakdown & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Divisi Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 border border-blue-50/40">
            <h3 className="font-bold text-base text-[#0b1c30] mb-4">Distribusi Amil per Departemen / Divisi</h3>
            <div className="space-y-3.5">
              {divisions.slice(0, 6).map((div, i) => (
                <div key={div.name} className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-[#434654] w-36 truncate">{div.name}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${divColors[i % divColors.length]}`}
                      style={{ width: `${Math.round((div.count / maxDivCount) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-[#0b1c30] w-12 text-right">{div.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm shadow-blue-500/5 border border-blue-50/40">
            <h3 className="font-bold text-base text-[#0b1c30] mb-4">Aktivitas Terkini</h3>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-[#737686] py-6 text-center">Belum ada aktivitas tercatat.</p>
              ) : (
                activities.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0053d0] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">{act.type === 'check_circle' ? 'check_circle' : 'person'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#0b1c30]">{act.title}</p>
                      <p className="text-[#737686] mt-0.5">{act.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
