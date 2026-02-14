<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $guarded = ['id'];

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }

    public function debt()
    {
        return $this->hasOne(Debt::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
