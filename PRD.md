# PRD — INSAAN (INformasi Sistem Administrasi Amil dan Nadzhir)

**HRIS Al Azhar Peduli**

| | |
|---|---|
| **Versi** | 1.0 (Draft) |
| **Tanggal** | Oktober 2026 |
| **Audiens** | Tim Developer, HR, Keuangan |
| **Sumber** | Dokumen "INSAAN HRIS — Product Detail & Spesifikasi untuk Tim Developer" |
| **Status** | Draft — butuh konfirmasi HR/Keuangan atas item bertanda *(Asumsi)* dan Pertanyaan Terbuka (Bagian 11) |

> Catatan: Bagian 1–10 mengikuti spesifikasi sumber. Bagian yang saya tambahkan sebagai usulan (bukan dari dokumen sumber) diberi label **[Usulan]**.

---

## 1. Ringkasan Produk

INSAAN adalah sistem HRIS internal untuk mengelola siklus kerja amil dan nadzhir Al Azhar Peduli: dari rekrutmen, administrasi data, kehadiran, hingga penggajian dan reimbursement.

**Tujuan utama:** menggantikan proses manual (spreadsheet, formulir kertas) dengan satu sumber data yang akurat, dapat diaudit, dan mudah diakses karyawan lewat self service.

### 1.1 Modul dan Prioritas

| Modul | Cakupan | Prioritas |
|---|---|---|
| **M1 Kehadiran** | Absensi, Cuti, Lembur, Live Tracking (karyawan lapangan), Shift | P1 |
| **M2 Penggajian** | Hitung gaji, distribusi slip, reimbursement, laporan gaji & reimbursement | P1 |
| **M3 Administrasi SDM** | Database karyawan, template dokumen, self service (termasuk pengajuan reimbursement) | P0 (fondasi) |
| **M4 Akuisisi SDM** | Recruitment, assessment kandidat | P2 |

### 1.2 Tujuan Produk
- Satu sumber data karyawan yang akurat dan dapat diaudit.
- Otomatisasi perhitungan kehadiran → gaji, mengurangi kesalahan hitung manual.
- Self service untuk karyawan (absen, cuti, lembur, reimbursement, slip gaji).
- Pelacakan karyawan lapangan dengan persetujuan dan transparansi privasi.
- Alur persetujuan seragam (satu engine approval) untuk cuti, lembur, reimbursement, dan koreksi absensi.

### 1.3 Di Luar Cakupan (Non-Goals) **[Usulan]**
Item berikut tidak disebut di dokumen sumber dan sebaiknya dikonfirmasi sebagai out of scope v1.0:
- Penilaian kinerja (KPI/appraisal), pelatihan, dan manajemen aset.
- Akuntansi/general ledger dan integrasi ke sistem keuangan di luar ekspor file transfer bank.
- Pengiriman pembayaran gaji langsung ke bank (sistem hanya menghasilkan file ekspor).

---

## 2. Pengguna dan Hak Akses

| Role | Hak akses utama |
|---|---|
| **Super Admin (IT)** | Konfigurasi sistem, kelola user & role, audit log. Tidak melihat nominal gaji kecuali diberi izin eksplisit. |
| **Admin HR** | Kelola database karyawan, shift, cuti, template dokumen, recruitment, koreksi absensi. |
| **Finance / Payroll** | Hitung & finalisasi gaji, setujui reimbursement, akses laporan keuangan SDM. |
| **Atasan / Kepala Divisi** | Setujui cuti, lembur, reimbursement bawahan; lihat absensi & live tracking tim. |
| **Karyawan (Amil/Nadzhir)** | Self service: absen, ajukan cuti/lembur/reimbursement, lihat slip gaji & profil sendiri. |
| **Kandidat (eksternal)** | Melamar & mengikuti assessment lewat tautan khusus. Tanpa akses ke data internal. |

**Aturan umum**
- RBAC berbasis role + scope unit/divisi.
- Semua aksi sensitif (ubah gaji, ubah data karyawan, koreksi absensi, approval) dicatat di audit log: siapa, kapan, nilai lama → baru.
- Alur persetujuan memakai **engine approval yang sama** untuk cuti, lembur, dan reimbursement.

---

## 3. Modul 1 — Manajemen Kehadiran (P1)

### 3.1 Absensi

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| ATT-01 | Clock-in/out via web & mobile dengan timestamp server. | Waktu diambil dari server, bukan perangkat. Satu karyawan tidak bisa clock-in dua kali tanpa clock-out. |
| ATT-02 | Validasi lokasi (geofence) per kantor/cabang & opsi selfie. | Radius per lokasi dapat dikonfigurasi. Di luar radius: ditolak atau ditandai "perlu verifikasi" sesuai pengaturan. |
| ATT-03 | Status otomatis: Hadir, Terlambat, Pulang Cepat, Alpa, Cuti, Izin, Libur. | Terlambat dihitung dari jadwal shift + toleransi menit (konfigurasi). Hari tanpa data dan tanpa cuti = Alpa pada tutup hari. |
| ATT-04 | Koreksi absensi (lupa absen) dengan approval. | Karyawan mengajukan, atasan menyetujui, Admin HR dapat override dengan alasan wajib. Seluruhnya tercatat di audit log. |
| ATT-05 | Rekap harian/bulanan & ekspor Excel/PDF. | Filter per divisi, periode, status. Rekap bulanan menjadi input M2. |
| ATT-06 | ~~Integrasi mesin fingerprint~~ — **tidak dipakai**. | Seluruh absensi dilakukan lewat aplikasi (web & mobile, ATT-01/ATT-02). Integrasi mesin fingerprint di luar cakupan. |

### 3.2 Cuti

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| LV-01 | Master jenis cuti: tahunan, sakit, melahirkan, haji/umrah, menikah, duka, dll. | Tiap jenis punya kuota, status berbayar/tidak, wajib lampiran atau tidak (mis. surat dokter), dan aturan minimal pengajuan. |
| LV-02 | Saldo cuti per karyawan per periode. | Saldo berkurang saat approved, dikembalikan bila dibatalkan. Hari libur & akhir pekan tidak memotong saldo. |
| LV-03 | Pengajuan, approval berjenjang, notifikasi. | Pengajuan bentrok dengan cuti lain ditolak. Status: Draft, Menunggu, Disetujui, Ditolak, Dibatalkan. |
| LV-04 | Kalender cuti tim & kalender libur nasional/cuti bersama. | Hari libur dapat diedit Admin HR tiap tahun. Cuti approved otomatis menjadi status absensi "Cuti". |

### 3.3 Lembur

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| OT-01 | Pengajuan lembur dengan tanggal, **jenis lembur (before shift / after shift)**, jam mulai/selesai, alasan; approval atasan. | Lembur hanya dihitung bila disetujui dan terbukti dari data absensi (jam aktual). *Before shift* = lembur sebelum jam masuk shift; *after shift* = lembur setelah jam pulang shift. Jam lembur dihitung terhadap jadwal shift karyawan (SH-01/SH-02). |
| OT-02 | Aturan tarif lembur dapat dikonfigurasi. | Tarif awal: **Rp10.000 per jam** (flat). Tarif *before shift* dan *after shift* **sama** (Rp10.000/jam); tarif tetap disimpan per jenis lembur sehingga dapat dibedakan di kemudian hari tanpa perubahan kode. Konfigurasi berversi dengan tanggal berlaku. Lembur dihitung **per jam** (pembulatan per jam; satuan pembulatan tetap dapat diatur). Nilai lembur = jam lembur approved × tarif jenis terkait, lalu masuk ke slip gaji (PAY-03). Opsi **[Usulan]**: pengali hari libur — belum ada keputusan, default tidak dipakai. |
| OT-03 | Batas jam lembur dapat diatur (dikonfigurasi) oleh Admin HR, dengan nilai awal **40 jam per bulan per karyawan**, dihitung dari **total gabungan lembur *before shift* dan *after shift***. Tidak ada batas harian tetap; jam lembur per hari menyesuaikan kebutuhan tugas. | Batas bersifat *soft limit*: karyawan **tetap dapat mengajukan lembur** walau total bulan berjalan sudah melewati batas, tetapi sistem menampilkan peringatan (ke karyawan saat mengajukan, serta ke atasan & HR saat approval) berisi total jam terpakai vs batas. Pengajuan tidak diblokir; keputusan tetap di approval atasan. Batas dapat diubah (global, per divisi, atau per karyawan) tanpa perubahan kode, berlaku sesuai tanggal efektif, dan perubahannya tercatat di audit log. Opsi **[Usulan]**: Admin HR dapat memilih mode "peringatan saja" (default) atau "blokir" bila kebijakan berubah. |

### 3.4 Live Tracking (karyawan lapangan)

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| LT-01 | Aplikasi mobile mengirim koordinat berkala hanya saat karyawan lapangan berstatus "Bertugas". | Interval konfigurasi (default 5 menit). Tracking berhenti otomatis saat clock-out. Tidak ada tracking di luar jam kerja. |
| LT-02 | Peta live untuk atasan/HR & riwayat rute per hari. | Hanya karyawan yang ditandai "lapangan" dan hanya atasan/HR terkait yang dapat melihat. |
| LT-03 | Check-in kunjungan (mitra, muzaki, mustahik) dengan foto & catatan. | Kunjungan tercatat lokasi + waktu sebagai bukti tugas; dapat menjadi dasar klaim reimbursement transport. |
| LT-04 | Persetujuan & transparansi privasi. | Karyawan menyetujui kebijakan pelacakan saat onboarding aplikasi. Data lokasi disimpan terbatas (retensi konfigurasi, default 90 hari). |

### 3.5 Shift

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| SH-01 | Master shift (nama, jam masuk/pulang, jam istirahat, lintas hari). | Mendukung shift malam yang melewati tengah malam; absensi dikaitkan ke tanggal mulai shift. |
| SH-02 | Penjadwalan per karyawan/divisi (mingguan/bulanan), bisa impor Excel. | Satu karyawan satu shift per hari; sistem memperingatkan jadwal tumpang tindih atau istirahat antar shift terlalu pendek. |
| SH-03 | Tukar shift antar karyawan dengan approval. | Perubahan jadwal setelah periode gaji dikunci tidak diizinkan. |

---

## 4. Modul 2 — Penggajian, Kompensasi & Tunjangan (P1)

### 4.1 Penghitungan Penggajian

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| PAY-01 | Struktur komponen gaji per karyawan: gaji pokok, tunjangan tetap, tunjangan tidak tetap, potongan. | Komponen dikelola sebagai master (nama, tipe: pendapatan/potongan, tetap/variabel, kena pajak ya/tidak) dan dapat ditambah tanpa perubahan kode. |
| PAY-02 | Periode penggajian bulanan; proses: Draft → Review → Disetujui → Dikunci → Dibayar. | Periode terkunci tidak bisa diubah; koreksi lewat penyesuaian di periode berikutnya. Tiap transisi status tercatat. |
| PAY-03 | Kalkulasi otomatis dari data M1 & komponen. | Mengambil: hari hadir, alpa, keterlambatan, lembur approved, cuti tidak berbayar. Prorata untuk karyawan masuk/keluar di tengah bulan. |
| PAY-04 | Potongan & kewajiban: BPJS Kesehatan/Ketenagakerjaan, PPh 21, pinjaman/kasbon. | Aturan dan tarif disimpan sebagai konfigurasi berversi dengan tanggal berlaku, bukan hard-code. Rincian aturan pajak *(Asumsi)* dikonfirmasi ke Keuangan. |
| PAY-05 | Pratinjau & simulasi sebelum finalisasi; ekspor file transfer bank. | Menampilkan selisih terhadap bulan lalu per karyawan. Format ekspor mengikuti bank yang dipakai *(Asumsi)*. |

### 4.2 Distribusi Slip Gaji

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| SLP-01 | Slip PDF otomatis per karyawan setelah periode disetujui. | Berisi seluruh komponen, periode, dan nomor dokumen unik. |
| SLP-02 | Distribusi lewat portal self service dan email. | PDF diproteksi password (mis. tanggal lahir). Status terkirim/dibuka dicatat; kirim ulang tersedia untuk HR. |
| SLP-03 | Karyawan hanya melihat slip miliknya. | Pengujian akses silang antar karyawan wajib lulus. |

### 4.3 Reimbursement

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| RMB-01 | Master kategori reimbursement (transport, kesehatan, operasional, dll.) dengan plafon. | Plafon per kategori per periode; pengajuan melebihi plafon ditandai. |
| RMB-02 | Alur: Diajukan → Approval atasan → Verifikasi Finance → Dibayar. | Bukti (foto/PDF) wajib. Penolakan wajib alasan. Reimbursement **dibayar terpisah dari gaji** (tidak masuk slip gaji), umumnya dalam **batch pembayaran seminggu sekali**. Reimbursement yang sudah lolos verifikasi Finance masuk antrean batch berikutnya; jadwal batch (default mingguan) dapat diatur. Status pembayaran dan tanggal bayar terlihat oleh karyawan di Self Service. |
| RMB-03 | Pengajuan hanya lewat Self Service (lihat HR-05). | Deteksi duplikat berdasarkan nominal, tanggal, dan nomor bukti. |

### 4.4 Laporan Penggajian & Reimbursement
- **RPT-01 Laporan Penggajian:** rekap per periode, per divisi, per komponen; total biaya SDM; ekspor Excel/PDF.
- **RPT-02 Laporan Reimbursement:** per kategori, per karyawan, status, dan realisasi vs plafon.
- Laporan hanya dapat dibuka oleh Finance dan role yang diberi izin; seluruh ekspor dicatat di audit log.

---

## 5. Modul 3 — Administrasi SDM (P0 / Fondasi)

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| HR-01 | Database karyawan: data pribadi, kontak darurat, jabatan, divisi, atasan, status (tetap/kontrak/relawan), tanggal masuk/keluar, rekening bank, NPWP, BPJS. | NIK karyawan unik & otomatis. Riwayat perubahan jabatan/gaji disimpan (effective date). Data sensitif dienkripsi di database. |
| HR-02 | Struktur organisasi: unit, divisi, jabatan, hierarki atasan. | Menjadi dasar rantai approval & scope akses data. |
| HR-03 | Dokumen karyawan (KTP, ijazah, kontrak) dengan pengingat kedaluwarsa kontrak. | File tersimpan terenkripsi, tipe & ukuran dibatasi (PDF/JPG/PNG, maks. 5 MB). Notifikasi H-30 sebelum kontrak berakhir. |
| HR-04 | Dokumen Template: surat kerja, kontrak, SK, surat peringatan, surat keterangan. | Template berisi placeholder (mis. `{{nama}}`, `{{jabatan}}`) yang terisi otomatis dari database; hasil dibuat sebagai PDF/DOCX bernomor otomatis. |
| HR-05 | Self Service: karyawan melihat/mengubah data terbatas, mengajukan cuti, lembur, koreksi absen, dan **reimbursement**, lalu memantau status. | Perubahan data inti (nama, rekening) memerlukan approval Admin HR. Notifikasi in-app dan email di setiap perubahan status. |
| HR-06 | Impor data awal dari Excel dengan validasi & laporan error per baris. | Diperlukan untuk migrasi dari data lama; impor harus dapat diulang tanpa menduplikasi data. |

---

## 6. Modul 4 — Akuisisi SDM (P2)

| ID | Requirement | Aturan bisnis & akseptansi |
|---|---|---|
| REC-01 | Permintaan tenaga kerja (job request) oleh atasan & lowongan dengan status Draft/Terbuka/Ditutup. | Lowongan hanya terbit setelah job request disetujui HR. |
| REC-02 | Halaman karir publik & formulir lamaran (CV, data diri, pertanyaan skrining). | Satu kandidat tidak dapat melamar ganda ke lowongan yang sama (cek email/NIK). Proteksi spam/captcha. |
| REC-03 | Pipeline kandidat: Pelamar → Seleksi Berkas → Tes/Assessment → Wawancara → Penawaran → Diterima/Ditolak. | Tampilan papan (kanban), riwayat tahapan & catatan per kandidat. |
| REC-04 | Penjadwalan wawancara & notifikasi email ke kandidat dan pewawancara. | Mendeteksi bentrok jadwal pewawancara. |
| ASM-01 | Assessment kandidat: tes online (pilihan ganda/isian) dengan batas waktu dan penilaian otomatis, serta form penilaian wawancara berbobot. | Bank soal per posisi; skor akhir = bobot tes + wawancara (bobot dikonfigurasi). Hasil hanya terlihat oleh HR & pewawancara. |
| REC-05 | Konversi kandidat "Diterima" menjadi data karyawan (onboarding). | Data lamaran otomatis menjadi draft di HR-01; tidak perlu input ulang. |

---

## 7. Alur Persetujuan (Cross-Module)

Satu engine approval dipakai bersama untuk cuti, lembur, reimbursement, koreksi absensi, tukar shift, dan perubahan data inti karyawan.

- Rantai approval mengikuti hierarki atasan dari struktur organisasi (HR-02); reimbursement ditambah langkah verifikasi Finance.
- Status baku: Draft, Menunggu, Disetujui, Ditolak, Dibatalkan.
- Penolakan wajib menyertakan alasan.
- Tiap langkah mencatat approver, status, catatan, dan waktu (entitas `approval` / `approval_step`).
- Notifikasi in-app dan email di setiap perubahan status.

---

## 8. Data Model Inti (Tingkat Entitas)

| Entitas | Field kunci & relasi |
|---|---|
| `employee` | id, nik, nama, status_kerja, unit_id, position_id, manager_id, tgl_masuk, tgl_keluar, is_field_staff |
| `org_unit` / `position` | id, nama, parent_id, level |
| `shift` / `shift_schedule` | shift: jam_masuk, jam_pulang, lintas_hari. schedule: employee_id, tanggal, shift_id |
| `attendance` | employee_id, tanggal, clock_in, clock_out, lat/lng, sumber, status, correction_id |
| `location_track` | employee_id, timestamp, lat, lng, akurasi |
| `leave_type` / `leave_balance` / `leave_request` | kuota, saldo per periode, tgl_mulai, tgl_selesai, status |
| `overtime_request` | employee_id, tanggal, jenis (before_shift/after_shift), jam_mulai, jam_selesai, jam_aktual, status |
| `pay_component` / `employee_pay_component` | tipe, tetap/variabel, kena_pajak; nilai & tanggal berlaku |
| `payroll_period` / `payslip` / `payslip_line` | periode, status, total; per karyawan; per komponen |
| `reimbursement_category` / `reimbursement` / `reimbursement_batch` | plafon; nominal, kategori, bukti, status, batch_id; batch: tanggal bayar, status, total |
| `approval` / `approval_step` | jenis_dokumen, ref_id, approver_id, status, catatan, waktu (dipakai bersama) |
| `doc_template` / `generated_document` | isi + placeholder; nomor, employee_id, file |
| `job_request` / `vacancy` / `candidate` / `application` / `assessment` | pipeline lamaran, skor tes & wawancara |
| `audit_log` / `user` / `role` | aktor, aksi, entitas, nilai lama/baru, timestamp |

---

## 9. Kebutuhan Non-Fungsional

| Area | Kebutuhan |
|---|---|
| **Keamanan** | Autentikasi password kuat + opsi 2FA untuk Finance/HR; sesi berbatas waktu; enkripsi data sensitif (gaji, rekening, NIK); HTTPS wajib; otorisasi dicek di sisi server pada setiap endpoint. |
| **Privasi data** | Data pribadi & lokasi hanya untuk tujuan kepegawaian; akses dibatasi role; kepatuhan pada UU Pelindungan Data Pribadi (UU PDP). |
| **Audit & integritas** | Audit log tidak dapat diubah; periode gaji terkunci bersifat immutable; backup harian dan uji restore berkala. |
| **Kinerja** | Halaman umum merespons < 2 detik; proses payroll ≤ 500 karyawan selesai < 2 menit berjalan sebagai background job; clock-in < 3 detik. |
| **Platform** | Web responsif untuk semua modul; absensi dan live tracking prioritas mobile (PWA atau aplikasi native, keputusan tim). |
| **Notifikasi** | Email dan in-app untuk seluruh perubahan status approval; opsi WhatsApp *(Asumsi)*. |
| **Lokalisasi** | Antarmuka Bahasa Indonesia; zona waktu WIB/WITA/WIT per lokasi; format mata uang Rupiah. |
| **Kualitas** | Unit test untuk seluruh aturan hitung (gaji, lembur, saldo cuti); UAT bersama HR & Keuangan sebelum rilis; dokumentasi API (OpenAPI). |

---

## 10. Fase Rilis

| Fase | Isi |
|---|---|
| **Fase 1** | Fondasi: autentikasi, role, audit log, engine approval, M3 (database, struktur organisasi, impor data awal) |
| **Fase 2** | M1: absensi, shift, cuti, lembur; Self Service dasar |
| **Fase 3** | M2: penggajian, slip gaji, reimbursement, laporan; Live Tracking |
| **Fase 4** | M4: recruitment & assessment; dokumen template lanjutan |

---

## 11. Asumsi dan Pertanyaan Terbuka

### 11.1 Asumsi yang perlu dikonfirmasi ke HR/Keuangan
Item bertanda *(Asumsi)* di dokumen sumber:
1. Rincian aturan pajak PPh 21 (PAY-04).
2. Format ekspor file transfer bank (PAY-05).
3. Notifikasi via WhatsApp (Bagian 9).

### 11.2 Pertanyaan terbuka (harus dijawab sebelum sprint terkait)
1. ~~Rumus lembur, tarif, dan batas jam~~ **Sudah diputuskan** *(OT-01, OT-02, OT-03, PAY-03)*:  
   - Tarif lembur **Rp10.000 per jam**, dengan dua jenis: *before shift* dan *after shift*, **tarifnya sama**.  
   - Lembur dihitung **per jam**.  
   - Batas jam dapat diatur, nilai awal 40 jam/bulan (total gabungan *before shift* + *after shift*), tanpa batas harian tetap; melewati batas tetap boleh mengajukan dengan peringatan.  
   - **Masih perlu dikonfirmasi:** (a) apakah ada tarif/pengali berbeda di hari libur; (b) arah pembulatan per jam: ke bawah (hanya jam penuh yang dihitung, mis. 1 jam 40 menit = 1 jam) atau ke atas.
2. Komponen tunjangan yang ada saat ini, aturan pajak PPh 21 (gross / net / gross-up), dan format file transfer bank. *(memengaruhi PAY-01, PAY-04, PAY-05)*
3. ~~Mesin fingerprint atau aplikasi?~~ **Sudah diputuskan:** tidak memakai mesin fingerprint; seluruh absensi via aplikasi *(ATT-06)*.
4. Daftar jenis cuti & kuota resmi, termasuk kebijakan cuti khusus (haji/umrah). *(LV-01)*
5. Siapa saja yang masuk kategori "karyawan lapangan" dan batas kebijakan privasi pelacakan. *(LT-01–LT-04)*
6. ~~Reimbursement bersama gaji atau terpisah?~~ **Sudah diputuskan:** dibayar terpisah dari gaji, umumnya seminggu sekali *(RMB-02)*.  
   - **Masih perlu dikonfirmasi:** hari pembayaran dalam seminggu, dan apakah ada pembayaran di luar jadwal untuk kasus mendesak.
7. Pilihan stack teknologi, hosting (cloud/on-premise), dan target jumlah pengguna. *(Bagian 9)*

---

## 12. Metrik Keberhasilan **[Usulan]**

Dokumen sumber belum mendefinisikan metrik. Usulan awal untuk didiskusikan (target angka perlu ditetapkan bersama HR/Keuangan):

| Area | Metrik |
|---|---|
| Adopsi | % karyawan aktif memakai absensi & self service |
| Efisiensi payroll | Waktu proses penggajian per periode dibanding proses manual |
| Akurasi | Jumlah koreksi gaji pasca-finalisasi per periode |
| Kehadiran | % absensi tervalidasi tanpa koreksi manual |
| Approval | Rata-rata waktu persetujuan cuti/lembur/reimbursement |
| Keamanan | Jumlah insiden akses data lintas karyawan (target 0) |

## 13. Risiko Utama **[Usulan]**

| Risiko | Mitigasi |
|---|---|
| Aturan hitung (PPh 21, BPJS, detail lembur) belum final | Simpan sebagai konfigurasi berversi; selesaikan Pertanyaan Terbuka 1–2 sebelum Fase 3; UAT bersama Keuangan |
| Keberatan privasi atas live tracking | Persetujuan eksplisit (LT-04), tracking hanya saat "Bertugas", retensi terbatas, akses dibatasi |
| Migrasi data lama berkualitas rendah | Impor Excel dengan validasi per baris dan dapat diulang (HR-06); dry-run sebelum cut-over |
| Kebocoran data sensitif (gaji, NIK, rekening) | Enkripsi, RBAC + scope, audit log, 2FA untuk Finance/HR |
| Ketergantungan antar-modul (M1 → M2) | Urutan fase: fondasi → M1 → M2; rekap bulanan M1 sebagai kontrak input M2 |