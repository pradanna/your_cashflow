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
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('unit'); // pcs, kg, dll
            $table->decimal('qty', 10, 2)->default(0);
            $table->decimal('avg_cost', 15, 2)->default(0); // Harga Modal Rata-rata
            $table->decimal('selling_price', 15, 2)->default(0); // Harga Jual Default
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
