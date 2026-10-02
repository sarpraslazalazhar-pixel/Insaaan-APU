<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrgUnit extends Model
{
    protected $table = 'org_units';

    protected $fillable = [
        'name',
        'code',
        'type',
        'is_official',
        'parent_id',
    ];

    protected $casts = [
        'is_official' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(OrgUnit::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(OrgUnit::class, 'parent_id');
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'org_unit_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Pegawai::class, 'unit_id');
    }
}
