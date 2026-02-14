<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Item;
use App\Models\SupplierItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CatalogController extends Controller
{
    /**
     * Menampilkan halaman katalog dengan data items dan supplier items.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $tab = $request->input('tab', 'items'); // Default tab 'items'
        $search = $request->input('search');

        // 1. Query untuk Items (Penjualan)
        $itemsQuery = Item::where('user_id', $user->id);

        if ($tab === 'items' && $search) {
            $itemsQuery->where('name', 'like', "%{$search}%");
        }

        // 2. Query untuk Supplier Items (Pembelian)
        $supplierItemsQuery = SupplierItem::where('user_id', $user->id)
            ->with('supplier'); // Eager load relasi ke Contact (Supplier)

        if ($tab === 'supplier_items') {
            if ($search) {
                $supplierItemsQuery->where('name', 'like', "%{$search}%");
            }
            if ($request->supplier_id) {
                $supplierItemsQuery->where('supplier_id', $request->supplier_id);
            }
        }


        // 3. Ambil Data Supplier untuk Dropdown Filter & Modal
        $suppliers = Contact::where('user_id', $user->id)
            ->whereIn('type', ['SUPPLIER', 'BOTH'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Catalogs/Index', [
            'items' => $itemsQuery->latest()->paginate(10)->withQueryString(),
            'supplierItems' => $supplierItemsQuery->latest()->paginate(10)->withQueryString(),
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'supplier_id', 'tab']),
        ]);
    }

    /**
     * Menyimpan Item Penjualan baru.
     * Route Name: items.store
     */
    public function storeItem(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'is_stock_active' => 'required|boolean',
        ]);

        $request->user()->items()->create([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'unit' => $validated['unit'],
            'is_stock_active' => $validated['is_stock_active'],
        ]);

        return redirect()->back()->with('success', 'Item penjualan berhasil ditambahkan.');
    }

    /**
     * Menyimpan Item Supplier baru.
     * Route Name: supplier-items.store
     */
    public function storeSupplierItem(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'supplier_id' => 'required|exists:contacts,id',
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
        ]);

        SupplierItem::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'contact_id' => $validated['supplier_id'],
            'price' => $validated['price'],
            'unit' => $validated['unit'],
        ]);

        return redirect()->back()->with('success', 'Item supplier berhasil ditambahkan.');
    }
}
