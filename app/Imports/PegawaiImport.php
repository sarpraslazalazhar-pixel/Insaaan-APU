<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;

class PegawaiImport implements ToArray
{
    public function array(array $array)
    {
        // Not used, we just use Excel::toArray() which utilizes this interface
    }
}
