<?php

namespace Database\Seeders;

use App\Models\OrgUnit;
use App\Models\Position;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class OrgStructureSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Root: LAZ Al Azhar
        $root = OrgUnit::firstOrCreate(
            ['code' => 'LAZ_PUSAT'],
            ['name' => 'LAZ Al Azhar', 'type' => 'formal', 'is_official' => true, 'parent_id' => null]
        );

        Position::firstOrCreate(
            ['code' => 'DIRUT_LAZ'],
            ['name' => 'Direktur Utama', 'org_unit_id' => $root->id, 'level' => 1]
        );

        // 2. Divisi-Divisi Utama
        $divisiList = [
            ['code' => 'DIV_SEKRETARIAT', 'name' => 'Sekretariat'],
            ['code' => 'DIV_KEUANGAN', 'name' => 'Keuangan'],
            ['code' => 'DIV_FUNDRAISING', 'name' => 'Fundraising & Partnership'],
            ['code' => 'DIV_PROGRAM', 'name' => 'Program'],
            ['code' => 'DIV_WAKAF', 'name' => 'Wakaf'],
        ];

        $divModels = [];
        foreach ($divisiList as $div) {
            $model = OrgUnit::firstOrCreate(
                ['code' => $div['code']],
                ['name' => $div['name'], 'type' => 'formal', 'is_official' => true, 'parent_id' => $root->id]
            );
            $divModels[$div['code']] = $model;

            Position::firstOrCreate(
                ['code' => 'KADIV_'.$div['code']],
                ['name' => 'Kepala Divisi '.$div['name'], 'org_unit_id' => $model->id, 'level' => 2]
            );
        }

        // 3. Sub-Unit di bawah Sekretariat
        $sekretariatSubs = [
            ['code' => 'SUB_HUMAS_GA_IT', 'name' => 'Humas, GA, dan IT'],
            ['code' => 'SUB_DIKLAT_LITBANG', 'name' => 'Diklat & Litbang'],
            ['code' => 'SUB_KELEMBAGAAN', 'name' => 'Kelembagaan'],
        ];
        foreach ($sekretariatSubs as $sub) {
            $unit = OrgUnit::firstOrCreate(
                ['code' => $sub['code']],
                ['name' => $sub['name'], 'type' => 'formal', 'is_official' => true, 'parent_id' => $divModels['DIV_SEKRETARIAT']->id]
            );

            Position::firstOrCreate(
                ['code' => 'MGR_'.$sub['code']],
                ['name' => 'Manager '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 3]
            );
            Position::firstOrCreate(
                ['code' => 'KOORD_'.$sub['code']],
                ['name' => 'Koordinator '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 4]
            );
            Position::firstOrCreate(
                ['code' => 'STAF_'.$sub['code']],
                ['name' => 'Staf Amil '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 5]
            );
        }

        // 4. Sub-Unit di bawah Keuangan
        $keuanganSubs = [
            ['code' => 'SUB_KEU_PENGELUARAN', 'name' => 'Pengeluaran'],
            ['code' => 'SUB_KEU_PENERIMAAN', 'name' => 'Penerimaan'],
            ['code' => 'SUB_KEU_ANGGARAN_AKUNTANSI', 'name' => 'Anggaran & Akuntansi'],
        ];
        foreach ($keuanganSubs as $sub) {
            $unit = OrgUnit::firstOrCreate(
                ['code' => $sub['code']],
                ['name' => $sub['name'], 'type' => 'formal', 'is_official' => true, 'parent_id' => $divModels['DIV_KEUANGAN']->id]
            );

            Position::firstOrCreate(
                ['code' => 'MGR_'.$sub['code']],
                ['name' => 'Manager '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 3]
            );
            Position::firstOrCreate(
                ['code' => 'KOORD_'.$sub['code']],
                ['name' => 'Koordinator '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 4]
            );
            Position::firstOrCreate(
                ['code' => 'STAF_'.$sub['code']],
                ['name' => 'Staf Amil '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 5]
            );
        }

        // 5. Sub-Unit & KPw di bawah Fundraising & Partnership
        $fundraisingSubs = [
            ['code' => 'SUB_FR_INTERNAL', 'name' => 'Internal Fundraising'],
            ['code' => 'SUB_FR_EKSTERNAL', 'name' => 'Eksternal Fundraising'],
            ['code' => 'KPW_JATENG', 'name' => 'KPw Jateng'],
            ['code' => 'KPW_JATIM', 'name' => 'KPw Jatim'],
            ['code' => 'KPW_SULSEL', 'name' => 'KPw Sulsel'],
            ['code' => 'KPW_SUMUT', 'name' => 'KPw Sumut'],
            ['code' => 'KPW_YOGYA', 'name' => 'KPw Yogyakarta'],
        ];
        foreach ($fundraisingSubs as $sub) {
            $unit = OrgUnit::firstOrCreate(
                ['code' => $sub['code']],
                ['name' => $sub['name'], 'type' => 'formal', 'is_official' => true, 'parent_id' => $divModels['DIV_FUNDRAISING']->id]
            );

            Position::firstOrCreate(
                ['code' => 'MGR_'.$sub['code']],
                ['name' => str_starts_with($sub['code'], 'KPW_') ? 'Kepala '.$sub['name'] : 'Manager '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 3]
            );
            Position::firstOrCreate(
                ['code' => 'KOORD_'.$sub['code']],
                ['name' => 'Koordinator '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 4]
            );
            Position::firstOrCreate(
                ['code' => 'STAF_'.$sub['code']],
                ['name' => 'Amil Pelaksana '.$sub['name'], 'org_unit_id' => $unit->id, 'level' => 5]
            );
        }

        // 6. Jabatan standar untuk Program & Wakaf
        foreach (['DIV_PROGRAM', 'DIV_WAKAF'] as $divCode) {
            Position::firstOrCreate(
                ['code' => 'STAF_'.$divCode],
                ['name' => 'Amil Pelaksana '.$divModels[$divCode]->name, 'org_unit_id' => $divModels[$divCode]->id, 'level' => 5]
            );
        }
    }
}
