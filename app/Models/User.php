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
        'role',
        'parent_id',
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

    /**
     * Get the active owner's user ID.
     */
    public function getOwnerIdAttribute(): int
    {
        return $this->role === 'karyawan' ? (int) $this->parent_id : (int) $this->id;
    }

    public function accounts()
    {
        return $this->hasMany(Account::class, 'user_id', $this->owner_id);
    }

    public function categories()
    {
        return $this->hasMany(Category::class, 'user_id', $this->owner_id);
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class, 'user_id', $this->owner_id);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'user_id', $this->owner_id);
    }

    public function items()
    {
        return $this->hasMany(Item::class, 'user_id', $this->owner_id);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'user_id', $this->owner_id);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'user_id', $this->owner_id);
    }

    public function debts()
    {
        return $this->hasMany(Debt::class, 'user_id', $this->owner_id);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'user_id', $this->owner_id);
    }
}
