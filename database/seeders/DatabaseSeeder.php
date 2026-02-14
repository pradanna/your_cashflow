<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Panggil UserSeeder yang baru dibuat
        $this->call([
            UserSeeder::class,
            // Nanti bisa tambah CategorySeeder, AccountSeeder, dll disini
        ]);
    }
}
