<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    protected $table = 'candidates';

    protected $guarded = ['id'];

    protected $casts = [
        'applied_at' => 'datetime',
    ];

    public function jobVacancy(): BelongsTo
    {
        return $this->belongsTo(JobVacancy::class, 'job_vacancy_id');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(CandidateAssessment::class, 'candidate_id')->orderBy('created_at', 'desc');
    }
}
