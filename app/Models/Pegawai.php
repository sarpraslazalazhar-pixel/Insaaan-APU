<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pegawai extends Model
{
    use SoftDeletes;

    protected $table = 'pegawai';

    protected $guarded = ['id'];

    protected $casts = [
        'join_date' => 'date:Y-m-d',
        'contract_end_date' => 'date:Y-m-d',
        'date_of_birth' => 'date:Y-m-d',
        'graduation_date' => 'date:Y-m-d',
        'spouse_dob' => 'date:Y-m-d',
        'inactive_date' => 'date:Y-m-d',
        'is_active' => 'boolean',
        'is_field_staff' => 'boolean',
    ];

    protected $appends = [
        'email',
        'mobile_phone_number',
        'citizen_id_address',
    ];

    public function getEmailAttribute(): ?string
    {
        return $this->attributes['email_kantor']
            ?? $this->attributes['email_pribadi']
            ?? ($this->attributes['email'] ?? null);
    }

    public function getMobilePhoneNumberAttribute(): ?string
    {
        return $this->attributes['mobile_phone']
            ?? ($this->attributes['mobile_phone_number'] ?? null);
    }

    public function getCitizenIdAddressAttribute(): ?string
    {
        return $this->attributes['nik_address']
            ?? ($this->attributes['citizen_id_address'] ?? null);
    }

    public function setEmailAttribute($value): void
    {
        $this->attributes['email_kantor'] = $value;
    }

    public function setMobilePhoneNumberAttribute($value): void
    {
        $this->attributes['mobile_phone'] = $value;
    }

    public function setCitizenIdAddressAttribute($value): void
    {
        $this->attributes['nik_address'] = $value;
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(OrgUnit::class, 'unit_id');
    }

    public function orgUnit(): BelongsTo
    {
        return $this->belongsTo(OrgUnit::class, 'unit_id');
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'manager_id');
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(Pegawai::class, 'manager_id');
    }

    public function careerHistory(): HasMany
    {
        return $this->hasMany(CareerHistory::class, 'employee_id');
    }

    public function familyMembers(): HasMany
    {
        return $this->hasMany(FamilyMember::class, 'employee_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(EmployeeDocument::class, 'employee_id');
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'employee_id');
    }
}
