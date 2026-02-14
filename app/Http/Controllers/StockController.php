<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Stock;
use App\Models\StockMutation;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockController extends Controller
{
    /**
     * Display a listing of the stocks.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $search = $request->search;

        // 1. Query Stocks
        $stocksQuery = Stock::where('user_id', $user->id);

        if ($search) {
            $stocksQuery->where('name', 'like', "%{$search}%");
        }

        $stocks = $stocksQuery->latest()->paginate(10)->withQueryString();

        // 2. Calculate Stats
        $allStocks = Stock::where('user_id', $user->id)->get();

        $totalAssetValue = $allStocks->sum(function ($stock) {
            return $stock->qty * $stock->selling_price;
        });

        $totalProductTypes = $allStocks->count();

        $lowStockCount = $allStocks->where('qty', '<', 500)->count();

        // 3. Recent History (Mutations)
        // Mengambil 10 aktivitas terakhir
        $mutations = StockMutation::whereHas('stock', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
            ->with('stock')
            ->latest()
            ->take(10)
            ->get();

        $contacts = Contact::where('user_id', $user->id)->whereIn('type', ['CUSTOMER', 'BOTH'])->orderBy('name')->get();
        $accounts = Account::where('user_id', $user->id)->orderBy('name')->get();
        $categories = Category::where('user_id', $user->id)->where('type', 'INCOME')->orderBy('name')->get();

        return Inertia::render('Stocks/Index', [
            'stocks' => $stocks,
            'mutations' => $mutations,
            'stats' => [
                'total_asset_value' => $totalAssetValue,
                'total_product_types' => $totalProductTypes,
                'low_stock_count' => $lowStockCount,
            ],
            'filters' => $request->only(['search']),
            'contacts' => $contacts,
            'accounts' => $accounts,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created stock in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'qty' => 'required|numeric|min:0', // Initial Qty
            'avg_cost' => 'required|numeric|min:0', // Initial Cost
            'selling_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request, $validated) {
            // 1. Create Stock Master
            $stock = $request->user()->stocks()->create([
                'name' => $validated['name'],
                'unit' => $validated['unit'],
                'qty' => $validated['qty'],
                'avg_cost' => $validated['avg_cost'],
                'selling_price' => $validated['selling_price'],
            ]);

            // 2. Create Initial Mutation if Qty > 0
            if ($validated['qty'] > 0) {
                StockMutation::create([
                    'stock_id' => $stock->id,
                    'type' => 'ADJUSTMENT', // Initial Balance considered as Adjustment
                    'qty' => $validated['qty'],
                    'current_qty' => $validated['qty'],
                    'current_avg_cost' => $validated['avg_cost'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Data stok berhasil ditambahkan.');
    }

    /**
     * Update the specified stock in storage.
     */
    public function update(Request $request, Stock $stock)
    {
        if ($stock->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'selling_price' => 'required|numeric|min:0',
        ]);

        // Note: Qty and Avg Cost are not updated here directly to maintain audit trail.
        // Use Adjustments or Purchases for that.
        $stock->update($validated);

        return redirect()->back()->with('success', 'Data stok diperbarui.');
    }

    /**
     * Remove the specified stock from storage.
     */
    public function destroy(Request $request, Stock $stock)
    {
        if ($stock->user_id !== $request->user()->id) {
            abort(403);
        }

        $stock->delete();

        return redirect()->back()->with('success', 'Data stok dihapus.');
    }

    /**
     * Handle Manual Stock In/Out (Adjustment).
     * Route: POST /stocks/{stock}/adjust
     */
    public function adjust(Request $request, Stock $stock)
    {
        if ($stock->user_id !== $request->user()->id) {
            abort(403);
        }

        $rules = [
            'type' => 'required|in:IN,OUT',
            'qty' => 'required|numeric|min:0.01',
        ];

        if ($request->type === 'OUT') {
            $rules['contact_id'] = 'required|exists:contacts,id';
            $rules['account_id'] = 'required|exists:accounts,id';
            $rules['category_id'] = 'required|exists:categories,id';
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($stock, $validated) {
            $qtyChange = $validated['qty'];

            if ($validated['type'] === 'OUT') {
                // Optional: Check if stock is sufficient
                // if ($stock->qty < $qtyChange) { ... }
                $stock->qty -= $qtyChange;

                // Create Income Transaction (Direct Sales)
                $totalAmount = $qtyChange * $stock->selling_price;
                $contact = Contact::find($validated['contact_id']);
                $contactName = $contact ? $contact->name : 'Unknown';

                Transaction::create([
                    'user_id' => $stock->user_id,
                    'account_id' => $validated['account_id'],
                    'category_id' => $validated['category_id'],
                    'type' => 'INCOME',
                    'amount' => $totalAmount,
                    'transaction_date' => now(),
                    'description' => "Penjualan Langsung (Stok Keluar): {$stock->name} ({$qtyChange} {$stock->unit}) - {$contactName}",
                ]);
            } else {
                $stock->qty += $qtyChange;
            }

            $stock->save();

            StockMutation::create([
                'stock_id' => $stock->id,
                'type' => $validated['type'],
                'qty' => $qtyChange,
                'current_qty' => $stock->qty,
                'current_avg_cost' => $stock->avg_cost, // Manual adjustment keeps same avg cost
            ]);
        });

        return redirect()->back()->with('success', 'Stok berhasil disesuaikan.');
    }
}
