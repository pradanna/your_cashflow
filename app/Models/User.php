<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    public function accounts()
    {
        return $this->hasMany(Account::class);
    }

    // Kita siapkan juga relasi lain agar tidak error nanti
    public function categories()
    {
        return $this->hasMany(Category::class);
    }
    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }
    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }
    public function items()
    {
        return $this->hasMany(Item::class);
    }
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function debts()
    {
        return $this->hasMany(Debt::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
