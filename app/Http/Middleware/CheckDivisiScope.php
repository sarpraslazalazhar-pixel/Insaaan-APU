<?php

namespace App\Http\Middleware;

use App\Models\Pegawai;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDivisiScope
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role && $user->role->name === 'manager_divisi') {
            $managerPegawai = Pegawai::find($user->employee_id);
            if ($managerPegawai && $managerPegawai->departement) {
                $division = $managerPegawai->departement;

                Pegawai::addGlobalScope('divisi_scope', function (Builder $builder) use ($division) {
                    $builder->where('departement', $division);
                });
            } else {
                // If the manager has no division, restrict them from seeing any pegawai
                Pegawai::addGlobalScope('divisi_scope', function (Builder $builder) {
                    $builder->whereNull('id');
                });
            }
        }

        return $next($request);
    }
}
