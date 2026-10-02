<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobVacancy extends Model
{
    protected $table = 'job_vacancies';

    protected $guarded = ['id'];

    protected $casts = [
        'deadline' => 'date:Y-m-d',
        'target_hires' => 'integer',
    ];

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class, 'job_vacancy_id');
    }
}
