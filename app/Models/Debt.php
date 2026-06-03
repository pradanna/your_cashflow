<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Debt extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['transaction_date'];

    public function getTransactionDateAttribute()
    {
        if ($this->order_id && $this->order) {
            return $this->order->transaction_date;
        }
        if ($this->purchase_id && $this->purchase) {
            return $this->purchase->transaction_date;
        }
        return $this->created_at ? $this->created_at->format('Y-m-d') : null;
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }
}
