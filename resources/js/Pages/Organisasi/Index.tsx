import React, { useState } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';

interface EmployeeInUnit {
  id: number;
  employee_id: string;
  full_name: string;
  current_position: string | null;
  unit_id: number | null;
  position_id: number | null;
  manager_id: number | null;
  job_level: string | null;
  is_field_staff: boolean;
}

interface OrgUnit {
  id: number;
  name: string;
  code: string | null;
  type: 'formal' | 'ad_hoc' | 'rintisan';
  is_official: boolean;
  parent_id: number | null;
  parent?: OrgUnit;
  children?: OrgUnit[];
  positions?: Position[];
  employees?: EmployeeInUnit[];
  employees_count?: number;
}

interface Position {
  id: number;
  name: string;
  code: string | null;
  org_unit_id: number | null;
  level: number | null;
  unit?: OrgUnit;
  employees_count?: number;
}

interface PegawaiSummary {
  id: number;
  employee_id: string;
  full_name: string;
  current_position: string | null;
  unit_id: number | null;
  position_id: number | null;
  manager_id: number | null;
  job_level: string | null;
  is_field_staff: boolean;
  org_unit?: OrgUnit;
  position?: Position;
  manager?: PegawaiSummary;
}

interface Props {
  units: OrgUnit[];
  positions: Position[];
  allPegawai: PegawaiSummary[];
  leaders: PegawaiSummary[];
  summary: {
    totalUnits: number;
    totalFormalUnits: number;
    totalAdhocUnits: number;
    totalPositions: number;
    totalAmil: number;
    totalFieldAmil: number;
  };
}

export default function Index({ units, positions, allPegawai, leaders, summary }: Props) {
  const [viewMode, setViewMode] = useState<'chart_unit' | 'chart_personnel' | 'table_positions'>('chart_unit');
  const [showAdHoc, setShowAdHoc] = useState<boolean>(false);
  const [positionFilterUnit, setPositionFilterUnit] = useState<string>('all');
  const [positionSearch, setPositionSearch] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiSummary | null>(null);

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  // Form for Unit
  const unitForm = useForm({
    name: '',
    code: '',
    type: 'formal',
    is_official: true,
    parent_id: '',
  });

  // Form for Position
  const positionForm = useForm({
    name: '',
    code: '',
    org_unit_id: '',
    level: '4',
  });

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    unitForm.post('/organisasi/unit', {
      onSuccess: () => {
        unitForm.reset();
        setShowUnitModal(false);
      },
    });
  };

  const handlePositionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPosition) {
      positionForm.put(`/organisasi/position/${editingPosition.id}`, {
        onSuccess: () => {
          positionForm.reset();
          setEditingPosition(null);
          setShowPositionModal(false);
        },
      });
    } else {
      positionForm.post('/organisasi/position', {
        onSuccess: () => {
          positionForm.reset();
          setShowPositionModal(false);
        },
      });
    }
  };

  const openAddPosition = (unitId?: number) => {
    setEditingPosition(null);
    positionForm.setData({
      name: '',
      code: '',
      org_unit_id: unitId ? unitId.toString() : '',
      level: '4',
    });
    setShowPositionModal(true);
  };

  const openEditPosition = (pos: Position) => {
    setEditingPosition(pos);
    positionForm.setData({
      name: pos.name,
      code: pos.code || '',
      org_unit_id: pos.org_unit_id ? pos.org_unit_id.toString() : '',
      level: pos.level ? pos.level.toString() : '4',
    });
    setShowPositionModal(true);
  };

  const handleResetAll = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh data unit & jabatan organisasi? Anda bisa membuatnya kembali dari awal.')) {
      router.post('/organisasi/reset');
    }
  };

  // Find root units (no parent) and their child units
  const rootUnits = units.filter((u) => !u.parent_id);
  const primaryRoot = rootUnits[0] || null;

  // Split child units into Formal (Resmi) vs Ad-Hoc / Satgas / Rintisan
  const allChildUnits = units.filter((u) => primaryRoot && u.parent_id === primaryRoot.id);
  const formalUnits = allChildUnits.filter((u) => u.type === 'formal' && u.is_official);
  const adhocUnits = allChildUnits.filter((u) => u.type !== 'formal' || !u.is_official);

  // Helper to get subordinates of an employee
  const getSubordinates = (managerId: number) => {
    return allPegawai.filter((p) => p.manager_id === managerId);
  };

  const filteredPositions = positions.filter((pos) => {
    if (positionFilterUnit !== 'all' && pos.org_unit_id?.toString() !== positionFilterUnit) {
      return false;
    }
    if (positionSearch && !pos.name.toLowerCase().includes(positionSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const selectedUnitPositions = positions.filter((p) => selectedUnit && p.org_unit_id === selectedUnit.id);

  return (
    <AppLayout title="Bagan Struktur Organisasi">
      <div className="space-y-6 animate-fade-in">
        {/* Top Control Bar */}
        <div className="bg-white p-5 rounded-2xl border border-blue-50/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0053d0] text-2xl">account_tree</span>
              <h2 className="text-2xl font-extrabold text-[#0b1c30]">Bagan Struktur Organisasi</h2>
            </div>
            <p className="text-xs text-[#737686] mt-0.5">
              Diagram visual hierarki unit resmi (SK) &amp; unit ad-hoc/satgas Al Azhar Peduli
            </p>
          </div>

          {/* View Mode & Zoom Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-[#f8f9ff] p-1 rounded-xl border border-blue-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('chart_unit')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'chart_unit' ? 'bg-[#0053d0] text-white shadow-sm' : 'text-[#737686] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">schema</span>
                Bagan Unit &amp; Satgas
              </button>
              <button
                type="button"
                onClick={() => setViewMode('chart_personnel')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'chart_personnel' ? 'bg-[#0053d0] text-white shadow-sm' : 'text-[#737686] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">groups</span>
                Rantai Komando Amil
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table_positions')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table_positions' ? 'bg-[#0053d0] text-white shadow-sm' : 'text-[#737686] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">work</span>
                Daftar Jabatan ({positions.length})
              </button>
            </div>

            {/* Zoom Slider */}
            <div className="hidden sm:flex items-center bg-[#f8f9ff] px-2 py-1 rounded-xl border border-blue-100 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="p-1 text-slate-500 hover:text-black cursor-pointer"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span className="font-mono text-[11px] font-bold text-slate-700 w-9 text-center">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="p-1 text-slate-500 hover:text-black cursor-pointer"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 text-slate-400 hover:text-blue-600 text-[10px] font-bold ml-1 cursor-pointer"
                title="Reset Zoom"
              >
                100%
              </button>
            </div>

            <button
              onClick={() => setShowUnitModal(true)}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#0053d0] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">domain_add</span>
              + Unit / Satgas
            </button>
            <button
              onClick={() => openAddPosition()}
              className="px-3.5 py-2 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              + Jabatan
            </button>

            {units.length > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                title="Kosongkan seluruh unit dan jabatan untuk susun dari awal"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                Kosongkan
              </button>
            )}
          </div>
        </div>

        {/* Legend / Key bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-5 py-3 rounded-2xl border border-blue-50/50 shadow-sm text-xs gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-[#737686]">Petunjuk Bagan:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-600 border border-blue-700"></span>
              <span className="font-semibold text-slate-700">Kantor Pusat (Pucuk Pimpinan)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white border-2 border-blue-500"></span>
              <span className="font-semibold text-slate-700">Divisi &amp; Unit Resmi (SK)</span>
            </div>
            {adhocUnits.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors ml-2">
                <input
                  type="checkbox"
                  checked={showAdHoc}
                  onChange={(e) => setShowAdHoc(e.target.checked)}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-amber-900">
                  Tampilkan Satgas / Non-SK ({adhocUnits.length})
                </span>
              </label>
            )}
          </div>
          <span className="text-[11px] text-slate-400">Klik kartu unit untuk melihat detail amil &amp; jabatan</span>
        </div>

        {/* MAIN ORGANIZATIONAL CHART CANVAS */}
        <div className="bg-[#f8fafd] border border-blue-100 rounded-3xl p-6 lg:p-10 overflow-x-auto shadow-inner min-h-[620px] relative">
          <div
            className="transition-transform duration-200 origin-top flex flex-col items-center min-w-[960px] pb-10"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* VIEW 1: BAGAN UNIT & SATGAS ORGANISASI */}
            {viewMode === 'chart_unit' && (
              <div className="w-full flex flex-col items-center">
                {/* 1. ROOT NODE (KANTOR PUSAT / HOLDING) */}
                {primaryRoot ? (
                  <div className="flex flex-col items-center">
                    <div
                      onClick={() => setSelectedUnit(primaryRoot)}
                      className="bg-gradient-to-r from-[#0053d0] to-blue-700 text-white p-5 rounded-2xl shadow-xl shadow-blue-500/25 border-2 border-blue-400 w-80 text-center cursor-pointer hover:scale-105 transition-transform relative group"
                    >
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                        {primaryRoot.code || 'KP'} • PUSAT INDUK
                      </span>
                      <h3 className="text-lg font-black mt-1.5 leading-tight">{primaryRoot.name}</h3>
                      <p className="text-xs text-blue-100 mt-1">Al Azhar Peduli</p>
                      <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-[11px] font-bold">
                        <span>{primaryRoot.employees_count || 0} Amil Bertugas</span>
                        <span className="underline group-hover:text-blue-200">Lihat Detail ➔</span>
                      </div>
                    </div>

                    {/* Vertical Connector Line from Root */}
                    <div className="w-0.5 h-10 bg-blue-400"></div>
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-blue-200 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0053d0] flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">account_tree</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-[#0b1c30]">Struktur Organisasi Masih Kosong</h4>
                      <p className="text-xs text-[#737686] mt-1">
                        Silakan mulai buat struktur organisasi dari awal sesuai kebutuhan. Mulai dengan membuat Unit Utama / Pimpinan (misal: Kantor Pusat / Yayasan / Direktur), lalu tambahkan divisi atau satgas di bawahnya.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => router.post('/organisasi/seed-default')}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                        Muat Struktur Riil LAZ Al Azhar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUnitModal(true)}
                        className="px-5 py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Buat Manual Sendiri
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. OFFICIAL DIVISIONS HIERARCHY TREE */}
                {formalUnits.length > 0 && (
                  <div className="w-full flex flex-col items-center">
                    {/* Horizontal Bridge Line across official divisions */}
                    <div className="w-11/12 max-w-6xl h-0.5 bg-blue-300"></div>

                    {/* Official Divisions Grid */}
                    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-6">
                      {formalUnits.map((unit) => {
                        const subUnits = units.filter((sub) => sub.parent_id === unit.id);
                        const kpwUnits = subUnits.filter((sub) => sub.name.startsWith('KPw') || sub.code?.startsWith('KPW'));
                        const regularSubUnits = subUnits.filter((sub) => !sub.name.startsWith('KPw') && !sub.code?.startsWith('KPW'));
                        const unitKadiv = positions.filter((p) => p.org_unit_id === unit.id && p.level === 2);
                        const unitManagers = positions.filter((p) => p.org_unit_id === unit.id && p.level === 3);
                        const unitKoords = positions.filter((p) => p.org_unit_id === unit.id && p.level === 4);

                        return (
                          <div key={unit.id} className="flex flex-col items-center">
                            {/* Stem connector line down from horizontal bridge */}
                            <div className="w-0.5 h-6 bg-blue-300 -mt-6 mb-0"></div>

                            {/* Division Card */}
                            <div
                              onClick={() => setSelectedUnit(unit)}
                              className="bg-white p-4 rounded-2xl border-2 border-blue-200 hover:border-[#0053d0] hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer w-full space-y-3 group text-left shadow-sm"
                            >
                              <div className="flex items-start justify-between">
                                <span className="font-mono text-[10px] font-bold text-[#0053d0] bg-blue-50 px-2 py-0.5 rounded">
                                  {unit.code || 'DIV'}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  Resmi (SK)
                                </span>
                              </div>

                              <div>
                                <h4 className="font-black text-sm text-[#0b1c30] group-hover:text-[#0053d0] transition-colors leading-snug">
                                  {unit.name}
                                </h4>
                                <p className="text-[11px] text-[#737686] mt-0.5">
                                  {unit.employees_count || 0} Amil • {subUnits.length} Bagian
                                </p>
                              </div>

                              {/* Kepala Divisi Display */}
                              {unitKadiv.length > 0 && (
                                <div className="pt-2 border-t border-blue-50 space-y-1">
                                  <span className="text-[9px] font-bold text-[#0053d0] uppercase tracking-wider block">
                                    Kepala Divisi:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {unitKadiv.map((k) => (
                                      <span key={k.id} className="px-1.5 py-0.2 bg-blue-100 text-[#0053d0] rounded text-[9px] font-bold border border-blue-200">
                                        {k.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Manager Display */}
                              {unitManagers.length > 0 && (
                                <div className="pt-2 border-t border-blue-50 space-y-1">
                                  <span className="text-[9px] font-bold text-[#737686] uppercase tracking-wider block">
                                    Manager:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {unitManagers.map((m) => (
                                      <span key={m.id} className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded text-[9px] font-bold border border-emerald-100">
                                        {m.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Koordinator Display */}
                              {unitKoords.length > 0 && (
                                <div className="pt-2 border-t border-blue-50 space-y-1">
                                  <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">
                                    Koordinator:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {unitKoords.map((kd) => (
                                      <span key={kd.id} className="px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded text-[9px] font-bold border border-amber-100">
                                        {kd.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Regular Sub-Units */}
                              {regularSubUnits.length > 0 && (
                                <div className="pt-2 border-t border-blue-50 space-y-1">
                                  <span className="text-[9px] font-bold text-[#737686] uppercase tracking-wider block">
                                    Bagian ({regularSubUnits.length}):
                                  </span>
                                  <div className="space-y-1">
                                    {regularSubUnits.map((sub) => (
                                      <div
                                        key={sub.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedUnit(sub);
                                        }}
                                        className="p-1.5 rounded-lg bg-[#f8fafd] hover:bg-blue-50 border border-blue-100 flex items-center justify-between text-[11px]"
                                      >
                                        <span className="font-bold text-[#0b1c30] truncate">{sub.name}</span>
                                        <span className="text-[9px] font-bold text-[#0053d0] bg-white px-1.5 py-0.2 rounded border border-blue-100 shrink-0 ml-1">
                                          {sub.employees_count || 0}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* KPw Wilayah Group (misal di Fundraising & Partnership) */}
                              {kpwUnits.length > 0 && (
                                <div className="pt-2 border-t border-blue-50 space-y-1">
                                  <span className="text-[9px] font-bold text-[#737686] uppercase tracking-wider block">
                                    Kantor Perwakilan ({kpwUnits.length}):
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {kpwUnits.map((kpw) => (
                                      <span
                                        key={kpw.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedUnit(kpw);
                                        }}
                                        className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0053d0] hover:bg-blue-100 font-bold text-[10px] border border-blue-100"
                                      >
                                        {kpw.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t border-blue-50 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium">Buka Detail</span>
                                <span className="text-[#0053d0] font-bold">➔</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. OPTIONAL AD-HOC SECTION (HANYA MUNCUL JIKA TOGGLE DIAKTIFKAN) */}
                {showAdHoc && adhocUnits.length > 0 && (
                  <div className="w-full max-w-6xl mt-12 pt-8 border-t-2 border-dashed border-amber-300 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4 bg-amber-100 px-4 py-1.5 rounded-full border border-amber-300">
                      <span className="material-symbols-outlined text-amber-800 text-sm">pending_actions</span>
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                        Satgas &amp; Unit Ad-Hoc Tambahan (Non-SK)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                      {adhocUnits.map((unit) => (
                        <div
                          key={unit.id}
                          onClick={() => setSelectedUnit(unit)}
                          className="bg-white p-4 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer space-y-2 text-left"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              {unit.code || 'SATGAS'}
                            </span>
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Non-SK
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-[#0b1c30]">{unit.name}</h4>
                          <p className="text-[10px] text-[#737686]">{unit.employees_count || 0} Amil Terlibat</p>
                          <div className="text-[9px] text-amber-900 bg-amber-50 p-1.5 rounded font-medium">
                            Approval: PIC Satgas ➔ HRD
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: BAGAN RANTAI KOMANDO AMIL (ATASAN-BAWAHAN) */}
            {viewMode === 'chart_personnel' && (
              <div className="w-full flex flex-col items-center space-y-8">
                {leaders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">Belum ada data pimpinan amil.</div>
                ) : (
                  leaders.map((leader) => {
                    const subordinates = getSubordinates(leader.id);
                    const leaderUnit = leader.org_unit;
                    const isAdHoc = leaderUnit && (leaderUnit.type !== 'formal' || !leaderUnit.is_official);

                    return (
                      <div key={leader.id} className="w-full flex flex-col items-center">
                        {/* Level 1 Node: Leader Card */}
                        <div
                          onClick={() => setSelectedPegawai(leader)}
                          className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 w-72 text-center cursor-pointer hover:scale-105 transition-all relative"
                        >
                          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-md">
                            {leader.full_name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-black rounded-full">
                            DIREKTUR UTAMA
                          </span>
                          <h4 className="font-black text-sm text-[#0b1c30] mt-1">{leader.full_name}</h4>
                          <p className="text-xs text-[#737686]">{leader.current_position || 'Direktur Utama'}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">NIP: {leader.employee_id}</p>
                          <div className="mt-2 pt-2 border-t border-emerald-50 text-[11px] font-bold text-emerald-700">
                            {subordinates.length} Amil Langsung
                          </div>
                        </div>

                        {/* Connector down to subordinates */}
                        {subordinates.length > 0 && (
                          <div className="w-full flex flex-col items-center mt-0">
                            <div className="w-0.5 h-8 bg-blue-300"></div>
                            <div className="w-3/4 h-0.5 bg-blue-300"></div>

                            {/* Subordinates Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 w-full">
                              {subordinates.map((sub) => {
                                const subSubordinates = getSubordinates(sub.id);
                                const subUnit = sub.org_unit;
                                const isSubAdhoc = subUnit && (subUnit.type !== 'formal' || !subUnit.is_official);

                                return (
                                  <div
                                    key={sub.id}
                                    onClick={() => setSelectedPegawai(sub)}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                                      isSubAdhoc
                                        ? 'bg-amber-50/50 border-dashed border-amber-300 hover:border-amber-500'
                                        : 'bg-white border-blue-200 hover:border-[#0053d0]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0053d0] font-bold flex items-center justify-center shrink-0">
                                        {sub.full_name.substring(0, 2).toUpperCase()}
                                      </div>
                                      <div className="overflow-hidden">
                                        <h5 className="font-extrabold text-xs text-[#0b1c30] truncate">{sub.full_name}</h5>
                                        <p className="text-[11px] text-[#737686] truncate">
                                          {sub.position?.name || sub.current_position || 'Staf'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                      <span className="font-mono text-slate-400">{sub.employee_id}</span>
                                      {sub.is_field_staff && (
                                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">
                                          Lapangan (GPS)
                                        </span>
                                      )}
                                      {isSubAdhoc && (
                                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold rounded">
                                          Satgas (Approval HRD)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW 3: DAFTAR POSISI & JABATAN */}
            {viewMode === 'table_positions' && (
              <div className="w-full bg-white rounded-2xl border border-blue-50 p-6 space-y-4 text-left shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-50 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#0b1c30]">Katalog Master Jabatan ({positions.length})</h3>
                    <p className="text-xs text-[#737686]">Standarisasi level eselon dan penempatan unit amil</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Cari nama jabatan..."
                      value={positionSearch}
                      onChange={(e) => setPositionSearch(e.target.value)}
                      className="px-3 py-1.5 bg-[#f8f9ff] border border-blue-100 rounded-xl text-xs outline-none focus:bg-white focus:border-[#0053d0]"
                    />
                    <select
                      value={positionFilterUnit}
                      onChange={(e) => setPositionFilterUnit(e.target.value)}
                      className="px-3 py-1.5 bg-[#f8f9ff] border border-blue-100 rounded-xl text-xs outline-none focus:bg-white focus:border-[#0053d0]"
                    >
                      <option value="all">Semua Unit Kerja</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id.toString()}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => openAddPosition()}
                      className="px-3 py-1.5 bg-[#0053d0] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                    >
                      + Tambah Jabatan
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#f8f9ff] border-b border-blue-100 text-[#737686] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Nama Jabatan</th>
                        <th className="py-3 px-4">Kode Posisi</th>
                        <th className="py-3 px-4">Unit / Divisi</th>
                        <th className="py-3 px-4">Level / Eselon</th>
                        <th className="py-3 px-4 text-center">Jumlah Amil</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {filteredPositions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400">
                            Tidak ada jabatan yang sesuai dengan pencarian / filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPositions.map((pos) => (
                          <tr key={pos.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#0b1c30]">{pos.name}</td>
                            <td className="py-3 px-4 font-mono text-[#737686]">{pos.code || '-'}</td>
                            <td className="py-3 px-4 text-[#434654] font-semibold">{pos.unit?.name || 'Lintas Unit'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                pos.level === 1 ? 'bg-purple-100 text-purple-800' :
                                pos.level === 2 ? 'bg-blue-100 text-blue-800' :
                                pos.level === 3 ? 'bg-emerald-100 text-emerald-800' :
                                pos.level === 4 ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {pos.level === 1 ? 'Level 1 (Direktur Utama)' :
                                 pos.level === 2 ? 'Level 2 (Kadiv)' :
                                 pos.level === 3 ? 'Level 3 (Manager)' :
                                 pos.level === 4 ? 'Level 4 (Koordinator)' :
                                 pos.level === 5 ? 'Level 5 (Staf Amil)' :
                                 `Level ${pos.level || '-'}`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-[#0b1c30]">
                              {pos.employees_count || 0} Amil
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditPosition(pos)}
                                  className="p-1 text-slate-400 hover:text-[#0053d0] rounded transition-colors cursor-pointer"
                                  title="Ubah Jabatan & Level"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Hapus jabatan ${pos.name}?`)) {
                                      router.delete(`/organisasi/position/${pos.id}`);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Hapus Jabatan"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDE DRAWER: DETAIL UNIT ORGANISASI */}
        {selectedUnit && (
          <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
            <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-blue-50 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-[#0053d0] bg-blue-50 px-2 py-0.5 rounded">
                    {selectedUnit.code || 'UNIT'}
                  </span>
                  <h3 className="font-extrabold text-lg text-[#0b1c30] mt-1">{selectedUnit.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Status and Classification */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#f8f9ff] border border-blue-50">
                  <span className="text-[#737686]">Klasifikasi Unit:</span>
                  <span className="font-bold text-[#0b1c30] capitalize">
                    {selectedUnit.type === 'formal' ? 'Formal / Struktural' : selectedUnit.type === 'ad_hoc' ? 'Satgas / Ad-Hoc' : 'Rintisan'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#f8f9ff] border border-blue-50">
                  <span className="text-[#737686]">Status Surat Keputusan (SK):</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${
                    selectedUnit.is_official ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {selectedUnit.is_official ? 'Resmi (Tercatat SK)' : 'Belum SK / Ad-Hoc'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-slate-700">
                  <span className="font-bold text-[#0053d0] block mb-0.5">Alur Persetujuan (Approval):</span>
                  {selectedUnit.is_official ? (
                    <p>Mengikuti rantai komando baku (Amil ➔ Kepala Divisi ➔ HRD).</p>
                  ) : (
                    <p className="text-amber-900 font-semibold">
                      Amil melapor ke Manajer/PIC Satgas. Pengajuan Manajer/PIC Satgas langsung disahkan oleh HRD (Divisi SDM).
                    </p>
                  )}
                </div>
              </div>

              {/* Daftar Jabatan di Unit Ini */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#0b1c30] uppercase tracking-wider">
                    Jabatan di Unit Ini ({selectedUnitPositions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => openAddPosition(selectedUnit.id)}
                    className="text-[11px] text-[#0053d0] font-bold hover:underline cursor-pointer"
                  >
                    + Tambah Jabatan
                  </button>
                </div>

                {selectedUnitPositions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl text-center">
                    Belum ada jabatan khusus terdaftar di unit ini.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedUnitPositions.map((pos) => (
                      <div
                        key={pos.id}
                        className="p-2.5 rounded-xl bg-[#f8f9ff] border border-blue-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#0b1c30]">{pos.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{pos.code || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pos.level === 4 ? 'bg-amber-100 text-amber-800' :
                            pos.level === 3 ? 'bg-emerald-100 text-emerald-800' :
                            pos.level === 2 ? 'bg-blue-100 text-blue-800' :
                            pos.level === 1 ? 'bg-purple-100 text-purple-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            Level {pos.level || '-'}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditPosition(pos)}
                            className="p-1 text-slate-400 hover:text-[#0053d0] rounded cursor-pointer"
                            title="Ubah Jabatan & Level"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus jabatan ${pos.name}?`)) {
                                router.delete(`/organisasi/position/${pos.id}`);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daftar Amil di Unit Ini */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#0b1c30] uppercase tracking-wider">
                    Daftar Amil di Unit Ini ({selectedUnit.employees?.length || 0})
                  </h4>
                  <Link
                    href={`/pegawai?division=${encodeURIComponent(selectedUnit.name)}`}
                    className="text-[11px] text-[#0053d0] font-bold hover:underline"
                  >
                    Buka di SDM ➔
                  </Link>
                </div>

                {(!selectedUnit.employees || selectedUnit.employees.length === 0) ? (
                  <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">
                    Belum ada amil yang ditugaskan ke unit ini.
                  </p>
                ) : (
                  <div className="divide-y divide-blue-50 border border-blue-50 rounded-xl overflow-hidden text-xs">
                    {selectedUnit.employees.map((emp) => (
                      <div key={emp.id} className="p-3 flex items-center justify-between hover:bg-blue-50/40">
                        <div>
                          <Link href={`/pegawai/${emp.id}`} className="font-bold text-[#0b1c30] hover:text-[#0053d0]">
                            {emp.full_name}
                          </Link>
                          <p className="text-[11px] text-[#737686]">{emp.current_position || 'Staf Amil'}</p>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{emp.employee_id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-blue-50 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus unit ${selectedUnit.name}? Posisi dan amil di unit ini akan dilepas hubungannya.`)) {
                      router.delete(`/organisasi/unit/${selectedUnit.id}`, {
                        onSuccess: () => setSelectedUnit(null),
                      });
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hapus Unit
                </button>
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIDE DRAWER: DETAIL AMIL */}
        {selectedPegawai && (
          <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
            <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-blue-50 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-[#0053d0] bg-blue-50 px-2 py-0.5 rounded">
                    NIP: {selectedPegawai.employee_id}
                  </span>
                  <h3 className="font-extrabold text-lg text-[#0b1c30] mt-1">{selectedPegawai.full_name}</h3>
                </div>
                <button
                  onClick={() => setSelectedPegawai(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#f8f9ff]">
                  <span className="text-[#737686]">Jabatan:</span>
                  <span className="font-bold text-[#0b1c30]">{selectedPegawai.current_position || 'Staf'}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#f8f9ff]">
                  <span className="text-[#737686]">Unit Kerja:</span>
                  <span className="font-bold text-[#0b1c30]">{selectedPegawai.org_unit?.name || 'Umum'}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#f8f9ff]">
                  <span className="text-[#737686]">Atasan Langsung:</span>
                  <span className="font-bold text-[#0053d0]">
                    {selectedPegawai.manager ? selectedPegawai.manager.full_name : 'Direktur Utama (Level 1)'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-50 flex gap-2">
                <Link
                  href={`/pegawai/${selectedPegawai.id}`}
                  className="flex-1 py-2.5 bg-[#0053d0] hover:bg-[#0043a8] text-white text-center font-bold text-xs rounded-xl shadow-md"
                >
                  Buka Profil Lengkap
                </Link>
                <button
                  onClick={() => setSelectedPegawai(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Tambah Unit Kerja */}
        {showUnitModal && (
          <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-blue-50 animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                <h3 className="font-extrabold text-base text-[#0b1c30]">Tambah Unit Kerja / Satgas</h3>
                <button
                  onClick={() => setShowUnitModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUnitSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Nama Unit / Satgas *</label>
                  <input
                    type="text"
                    required
                    value={unitForm.data.name}
                    onChange={(e) => unitForm.setData('name', e.target.value)}
                    placeholder="Contoh: Satgas Zakat Digital 1448H"
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-[#0053d0]"
                  />
                  {unitForm.errors.name && <p className="text-rose-500 mt-1">{unitForm.errors.name}</p>}
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Kode Singkat (Opsional)</label>
                  <input
                    type="text"
                    value={unitForm.data.code}
                    onChange={(e) => unitForm.setData('code', e.target.value)}
                    placeholder="Contoh: SATGAS_DIGITAL"
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-[#0053d0]"
                  />
                  {unitForm.errors.code && <p className="text-rose-500 mt-1">{unitForm.errors.code}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#434654] block mb-1">Tipe Unit</label>
                    <select
                      value={unitForm.data.type}
                      onChange={(e) => unitForm.setData('type', e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-[#0053d0]"
                    >
                      <option value="formal">Formal / Divisi Resmi</option>
                      <option value="ad_hoc">Ad-Hoc / Satgas / Proyek</option>
                      <option value="rintisan">Rintisan / Cabang Baru</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={unitForm.data.is_official}
                        onChange={(e) => unitForm.setData('is_official', e.target.checked)}
                        className="rounded border-blue-200 text-[#0053d0] focus:ring-[#0053d0]"
                      />
                      <span className="font-bold text-[#434654] text-[11px]">Sudah Ada SK Resmi</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Induk Unit (Parent)</label>
                  <select
                    value={unitForm.data.parent_id}
                    onChange={(e) => unitForm.setData('parent_id', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-[#0053d0]"
                  >
                    <option value="">-- Tingkat Utama / Tanpa Induk --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-blue-50">
                  <button
                    type="button"
                    onClick={() => setShowUnitModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={unitForm.processing}
                    className="px-5 py-2 bg-[#0053d0] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    Simpan Unit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Tambah Jabatan */}
        {showPositionModal && (
          <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-blue-50 animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                <h3 className="font-extrabold text-base text-[#0b1c30]">
                  {editingPosition ? 'Ubah Master Jabatan' : 'Tambah Master Jabatan'}
                </h3>
                <button
                  onClick={() => setShowPositionModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePositionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#434654] block mb-1">Nama Jabatan *</label>
                  <input
                    type="text"
                    required
                    value={positionForm.data.name}
                    onChange={(e) => positionForm.setData('name', e.target.value)}
                    placeholder="Contoh: Koordinator Program Mustahik"
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-[#0053d0]"
                  />
                  {positionForm.errors.name && <p className="text-rose-500 mt-1">{positionForm.errors.name}</p>}
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Kode Posisi (Opsional)</label>
                  <input
                    type="text"
                    value={positionForm.data.code}
                    onChange={(e) => positionForm.setData('code', e.target.value)}
                    placeholder="Contoh: KOORD_MUSTAHIK"
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-[#0053d0]"
                  />
                  {positionForm.errors.code && <p className="text-rose-500 mt-1">{positionForm.errors.code}</p>}
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Unit / Divisi Terkait</label>
                  <select
                    value={positionForm.data.org_unit_id}
                    onChange={(e) => positionForm.setData('org_unit_id', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-[#0053d0]"
                  >
                    <option value="">-- Lintas Unit / Umum --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.type !== 'formal' ? 'Satgas' : 'Formal'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#434654] block mb-1">Level / Eselon Jabatan</label>
                  <select
                    value={positionForm.data.level}
                    onChange={(e) => positionForm.setData('level', e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9ff] border border-blue-100 rounded-xl outline-none focus:bg-white focus:border-[#0053d0]"
                  >
                    <option value="1">Level 1 - Direktur Utama</option>
                    <option value="2">Level 2 - Kepala Divisi / Direktur Bidang</option>
                    <option value="3">Level 3 - Manager</option>
                    <option value="4">Level 4 - Koordinator</option>
                    <option value="5">Level 5 - Staf Amil / Pelaksana / Relawan</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-blue-50">
                  <button
                    type="button"
                    onClick={() => setShowPositionModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={positionForm.processing}
                    className="px-5 py-2 bg-[#0053d0] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {editingPosition ? 'Simpan Perubahan' : 'Simpan Jabatan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
