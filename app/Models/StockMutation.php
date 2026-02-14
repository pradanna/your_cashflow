<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMutation extends Model
{
    protected $guarded = ['id'];

    public function stock()
    {
        return $this->belongsTo(Stock::class);
    }

    // Melacak jika stok keluar karena Order
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Melacak jika stok masuk karena Purchase
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }
}
