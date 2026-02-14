<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierItem extends Model
{
    protected $guarded = ['id'];

    public function supplier()
    {
        // 'contact_id' adalah nama kolom di tabel supplier_items
        return $this->belongsTo(Contact::class, 'contact_id');
    }
}
