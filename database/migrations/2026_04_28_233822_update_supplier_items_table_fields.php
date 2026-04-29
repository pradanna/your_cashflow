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
        Schema::table('supplier_items', function (Blueprint $table) {
            $table->decimal('selling_price', 15, 2)->nullable()->after('price');
            
            // Mengubah kolom menjadi nullable
            $table->foreignId('contact_id')->nullable()->change();
            $table->string('name')->nullable()->change();
            $table->decimal('price', 15, 2)->nullable()->change();
            $table->string('unit')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_items', function (Blueprint $table) {
            $table->dropColumn('selling_price');

            // Mengembalikan kolom menjadi required
            $table->foreignId('contact_id')->nullable(false)->change();
            $table->string('name')->nullable(false)->change();
            $table->decimal('price', 15, 2)->nullable(false)->change();
            $table->string('unit')->nullable(false)->change();
        });
    }
};
