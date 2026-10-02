import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';
import { swalPrompt, swalSuccess, swalError } from '../../lib/swal';

interface ApprovalItem {
  id: number;
  document_type: 'cuti' | 'lembur' | 'reimbursement' | 'koreksi_absen';
  applicant_name: string;
  applicant_dept: string;
  unit_type?: string;
  is_direct_to_hrd?: boolean;
  approval_route?: string;
  title: string;
  description: string;
  amount?: number;
  date: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
}

interface Props {
  pendingApprovals: ApprovalItem[];
  historyApprovals: ApprovalItem[];
}

export const Index: React.FC<Props> = ({ pendingApprovals = [], historyApprovals = [] }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const handleApprove = (item: ApprovalItem) => {
    router.post(`/approvals/${item.document_type}/${item.id}/approve`, {}, {
      onSuccess: () => swalSuccess('Disetujui', `Pengajuan ${item.title} berhasil disetujui`),
      onError: () => swalError('Gagal menyetujui pengajuan'),
    });
  };

  const handleReject = async (item: ApprovalItem) => {
    const reason = await swalPrompt('Tolak Pengajuan', 'Masukkan alasan penolakan wajib...');
    if (reason) {
      router.post(`/approvals/${item.document_type}/${item.id}/reject`, { reason }, {
        onSuccess: () => swalSuccess('Ditolak', `Pengajuan ${item.title} ditolak`),
        onError: () => swalError('Gagal menolak pengajuan'),
      });
    }
  };

  return (
    <AppLayout title="Pusat Persetujuan (Unified Approvals)">
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">Pusat Persetujuan Terpadu</h2>
            <p className="text-sm text-[#434654] mt-1">Satu pintu verifikasi atasan &amp; HR untuk pengajuan Cuti, Lembur, dan Reimbursement</p>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-blue-100 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending' ? 'border-[#0053d0] text-[#0053d0]' : 'border-transparent text-[#737686]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            Menunggu Persetujuan ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'history' ? 'border-[#0053d0] text-[#0053d0]' : 'border-transparent text-[#737686]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Riwayat Keputusan
          </button>
        </div>

        {/* Pending Approvals List */}
        {activeTab === 'pending' && (
          <div className="space-y-4 animate-fade-in">
            {pendingApprovals.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-blue-50/50 shadow-sm text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-400">task_alt</span>
                <p className="font-bold text-sm text-[#0b1c30] mt-2">Semua tugas beres!</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada permohonan yang menunggu persetujuan Anda saat ini.</p>
              </div>
            ) : (
              pendingApprovals.map((item) => (
                <div
                  key={`${item.document_type}-${item.id}`}
                  className="bg-white p-5 rounded-2xl border border-blue-50/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-[#0053d0]">
                        {item.document_type}
                      </span>
                      {item.unit_type && item.unit_type !== 'formal' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900">
                          Unit Satgas / Ad-Hoc
                        </span>
                      )}
                      <span className="text-xs text-slate-400">• {item.date}</span>
                    </div>
                    <h4 className="font-extrabold text-base text-[#0b1c30]">{item.title}</h4>
                    <p className="text-xs text-[#434654]">
                      Diajukan oleh: <span className="font-bold text-[#0b1c30]">{item.applicant_name}</span> ({item.applicant_dept})
                    </p>
                    {item.approval_route && (
                      <div className="pt-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.is_direct_to_hrd
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-50 text-[#0053d0] border border-blue-100'
                        }`}>
                          <span className="material-symbols-outlined text-[13px]">
                            {item.is_direct_to_hrd ? 'verified_user' : 'account_tree'}
                          </span>
                          Jalur Persetujuan: {item.approval_route}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 italic">"{item.description}"</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleReject(item)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => handleApprove(item)}
                      className="px-5 py-2 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Setujui
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History List */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-blue-50/50 shadow-sm p-6 space-y-4 animate-fade-in">
            <h3 className="font-bold text-sm text-[#0b1c30]">Riwayat Persetujuan Sebelumnya</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9ff] text-[#737686] uppercase font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3">Amil</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {historyApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Belum ada riwayat persetujuan.
                      </td>
                    </tr>
                  ) : (
                    historyApprovals.map((h, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-bold uppercase">{h.document_type}</td>
                        <td className="py-2.5 px-3">{h.applicant_name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{h.title}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{h.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
