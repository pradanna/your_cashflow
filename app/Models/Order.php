<?php

namespace App\Models;

use App\Models\Contact;
use App\Models\OrderItem;
use App\Models\User;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'transaction_date' => 'date',
        'grand_total' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    // Relasi ke tabel Transaksi (Pemasukan)
    public function transaction()
    {
        return $this->hasMany(Transaction::class);
    }

    // Relasi ke tabel Piutang (Jika belum lunas)
    public function debt()
    {
        // Kita pakai hasOne karena satu order biasanya merujuk ke satu record piutang
        return $this->hasOne(Debt::class);
    }

    // Relasi ke Mutasi Stok
    public function stockMutations()
    {
        return $this->hasMany(StockMutation::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }
}
