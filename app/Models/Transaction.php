<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $guarded = ['id'];

    // PASTIKAN FUNGSI INI ADA
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function debt()
    {
        return $this->belongsTo(Debt::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }
}
