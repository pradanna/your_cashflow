<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Relasi ke Kategori (Misal: Kategori "Jasa Desain", "Makanan", "Cetak")
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            $table->string('name'); // Nama produk jual
            $table->decimal('price', 15, 2); // Harga jual default
            $table->string('unit'); // pcs, jam, paket

            // Opsional: Jika item ini adalah barang stok, link ke ID stock
            // $table->foreignId('stock_id')->nullable()->constrained()->nullOnDelete();

            $table->boolean('is_stock_active')->default(true); // Penanda apakah ini barang stok atau jasa

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
