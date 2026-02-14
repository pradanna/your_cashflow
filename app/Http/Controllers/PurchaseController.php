<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Debt;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Stock;
use App\Models\SupplierItem;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    /**
     * Menampilkan daftar pembelian dengan filter.
     */
    public function index(Request $request)
    {
        $query = Purchase::query()
            ->where('user_id', $request->user()->id)
            ->with(['contact', 'items', 'transaction.account', 'debt', 'order']);

        // Filter: Search (Reference Number / Supplier Name)
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('reference_number', 'like', '%' . $request->search . '%')
                    ->orWhereHas('contact', function ($q2) use ($request) {
                        $q2->where('name', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('order', function ($q3) use ($request) {
                        $q3->where('invoice_number', 'like', '%' . $request->search . '%');
                    });
            });
        }

        // Filter: Status
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Filter: Date Range
        if ($request->date_start) {
            $query->whereDate('transaction_date', '>=', $request->date_start);
        }
        if ($request->date_end) {
            $query->whereDate('transaction_date', '<=', $request->date_end);
        }

        // Sorting & Pagination
        $purchases = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Data untuk Modal Create/Edit
        $suppliers = Contact::where('user_id', $request->user()->id)
            ->whereIn('type', ['SUPPLIER', 'BOTH'])
            ->orderBy('name')
            ->get();

        $stocks = Stock::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        $accounts = Account::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        $categories = Category::where('user_id', $request->user()->id)
            ->where('type', 'EXPENSE')
            ->orderBy('name')
            ->get();

        $supplierItems = SupplierItem::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
            'filters' => $request->only(['search', 'status', 'date_start', 'date_end']),
            'suppliers' => $suppliers,
            'stocks' => $stocks,
            'accounts' => $accounts,
            'categories' => $categories,
            'supplierItems' => $supplierItems,
        ]);
    }

    /**
     * Menyimpan pembelian baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'nullable|exists:orders,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'reference_number' => 'nullable|string|max:255',
            'transaction_date' => 'required|date',
            'status' => 'required|in:UNPAID,PAID',
            'note' => 'nullable|string',
            'account_id' => 'nullable|required_if:status,PAID|exists:accounts,id',
            'category_id' => 'nullable|required_if:status,PAID|exists:categories,id',
            'items' => 'required|array|min:1',
            'items.*.stock_id' => 'nullable|exists:stocks,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {
            // Generate Reference Number: PUR/YYYYMMDD/XXXX
            $dateStr = date('Ymd', strtotime($validated['transaction_date']));
            $count = Purchase::where('user_id', $request->user()->id)
                ->whereDate('created_at', now())
                ->count() + 1;

            $referenceNumber = 'PUR/' . $dateStr . '/' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // Ensure uniqueness
            while (Purchase::where('reference_number', $referenceNumber)->exists()) {
                $count++;
                $referenceNumber = 'PUR/' . $dateStr . '/' . str_pad($count, 4, '0', STR_PAD_LEFT);
            }

            // 1. Hitung Grand Total
            $grandTotal = collect($validated['items'])->sum(fn($item) => $item['qty'] * $item['price']);

            // 2. Buat Purchase
            $purchase = Purchase::create([
                'user_id' => $request->user()->id,
                'order_id' => $validated['order_id'] ?? null,
                'contact_id' => $validated['contact_id'],
                'reference_number' => $referenceNumber,
                'transaction_date' => $validated['transaction_date'],
                'grand_total' => $grandTotal,
                'status' => $validated['status'],
                'note' => $validated['note'],
            ]);

            // 3. Buat Purchase Items & Update Stok
            foreach ($validated['items'] as $itemData) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'stock_id' => $itemData['stock_id'] ?? null,
                    'item_name' => $itemData['item_name'],
                    'qty' => $itemData['qty'],
                    'price' => $itemData['price'],
                    'subtotal' => $itemData['qty'] * $itemData['price'],
                ]);

                // Update stok jika stock_id ada
                if (isset($itemData['stock_id'])) {
                    $stock = Stock::find($itemData['stock_id']);
                    if ($stock) {
                        $oldQty = $stock->qty;
                        $oldAvgCost = $stock->avg_cost;
                        $newQty = $itemData['qty'];
                        $newPrice = $itemData['price'];

                        $totalQty = $oldQty + $newQty;
                        $newAvgCost = (($oldQty * $oldAvgCost) + ($newQty * $newPrice)) / $totalQty;

                        $stock->update([
                            'qty' => $totalQty,
                            'avg_cost' => $newAvgCost,
                        ]);
                    }
                }
            }

            // 4. Logika Keuangan
            if ($validated['status'] === 'PAID') {
                // Buat Transaksi Pengeluaran (EXPENSE)
                $itemSummary = collect($validated['items'])->pluck('item_name')->join(', ');
                Transaction::create([
                    'user_id' => $request->user()->id,
                    'account_id' => $validated['account_id'],
                    'category_id' => $validated['category_id'],
                    'purchase_id' => $purchase->id,
                    'type' => 'EXPENSE',
                    'amount' => $grandTotal,
                    'transaction_date' => $validated['transaction_date'],
                    'description' => "Pembelian ({$purchase->reference_number}): {$itemSummary}",
                ]);
            } else { // UNPAID
                // Catat Hutang (PAYABLE)
                Debt::create([
                    'user_id' => $request->user()->id,
                    'contact_id' => $validated['contact_id'],
                    'purchase_id' => $purchase->id,
                    'type' => 'PAYABLE', // Hutang kita ke supplier
                    'amount' => $grandTotal,
                    'remaining' => $grandTotal,
                    'status' => 'UNPAID',
                ]);
            }
        });

        return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil dibuat.');
    }

    /**
     * Menampilkan detail pembelian.
     */
    public function show(Purchase $purchase)
    {
        if ($purchase->user_id !== auth()->id()) {
            abort(403);
        }

        $purchase->load(['contact', 'items.stock', 'debt', 'transaction']);

        return Inertia::render('Purchases/Show', [
            'purchase' => $purchase,
        ]);
    }

    /**
     * Memperbarui pembelian.
     */
    public function update(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'contact_id' => 'nullable|required_if:status,UNPAID|exists:contacts,id',
            'reference_number' => 'nullable|string|max:255',
            'transaction_date' => 'required|date',
            'status' => 'required|in:UNPAID,PAID',
            'note' => 'nullable|string',
            'account_id' => 'nullable|required_if:status,PAID|exists:accounts,id',
            'category_id' => 'nullable|required_if:status,PAID|exists:categories,id',
            'items' => 'required|array|min:1',
            'items.*.stock_id' => 'nullable|exists:stocks,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request, $purchase) {
            // 1. Revert Stock Changes from Old Items
            foreach ($purchase->items as $item) {
                if ($item->stock_id) {
                    $stock = Stock::find($item->stock_id);
                    if ($stock) {
                        $currentTotalValue = $stock->qty * $stock->avg_cost;
                        $removedValue = $item->qty * $item->price;
                        $newQty = $stock->qty - $item->qty;
                        $newTotalValue = $currentTotalValue - $removedValue;

                        // Hitung ulang Avg Cost setelah stok dikembalikan
                        $newAvgCost = ($newQty > 0) ? $newTotalValue / $newQty : 0;

                        $stock->update([
                            'qty' => $newQty,
                            'avg_cost' => $newAvgCost,
                        ]);
                    }
                }
            }

            // 2. Delete Old Items
            $purchase->items()->delete();

            // 3. Calculate New Grand Total & Create New Items
            $grandTotal = 0;
            foreach ($validated['items'] as $itemData) {
                $subtotal = $itemData['qty'] * $itemData['price'];
                $grandTotal += $subtotal;

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'stock_id' => $itemData['stock_id'] ?? null,
                    'item_name' => $itemData['item_name'],
                    'qty' => $itemData['qty'],
                    'price' => $itemData['price'],
                    'subtotal' => $subtotal,
                ]);

                // Update Stock (Add New)
                if (isset($itemData['stock_id'])) {
                    $stock = Stock::find($itemData['stock_id']);
                    if ($stock) {
                        $oldQty = $stock->qty;
                        $oldAvgCost = $stock->avg_cost;
                        $newQty = $itemData['qty'];
                        $newPrice = $itemData['price'];

                        $totalQty = $oldQty + $newQty;
                        // Weighted Average Cost Formula
                        $newAvgCost = (($oldQty * $oldAvgCost) + ($newQty * $newPrice)) / $totalQty;

                        $stock->update([
                            'qty' => $totalQty,
                            'avg_cost' => $newAvgCost,
                        ]);
                    }
                }
            }

            // 4. Update Purchase Header
            $purchase->update([
                'contact_id' => $validated['contact_id'],
                'reference_number' => $validated['reference_number'] ?? $purchase->reference_number,
                'transaction_date' => $validated['transaction_date'],
                'grand_total' => $grandTotal,
                'status' => $validated['status'],
                'note' => $validated['note'],
            ]);

            // 5. Handle Financials
            $transaction = Transaction::where('purchase_id', $purchase->id)->first();
            $debt = Debt::where('purchase_id', $purchase->id)->first();

            if ($validated['status'] === 'PAID') {
                // Jika LUNAS: Hapus Hutang, Update/Buat Transaksi
                if ($debt) $debt->delete();

                $itemSummary = collect($validated['items'])->pluck('item_name')->join(', ');
                $desc = "Pembelian ({$purchase->reference_number}): {$itemSummary}";

                if ($transaction) {
                    $transaction->update([
                        'account_id' => $validated['account_id'],
                        'category_id' => $validated['category_id'],
                        'amount' => $grandTotal,
                        'transaction_date' => $validated['transaction_date'],
                        'description' => $desc,
                    ]);
                } else {
                    Transaction::create([
                        'user_id' => $request->user()->id,
                        'account_id' => $validated['account_id'],
                        'category_id' => $validated['category_id'],
                        'purchase_id' => $purchase->id,
                        'type' => 'EXPENSE',
                        'amount' => $grandTotal,
                        'transaction_date' => $validated['transaction_date'],
                        'description' => $desc,
                    ]);
                }
            } else {
                // Jika BELUM LUNAS: Hapus Transaksi, Update/Buat Hutang
                if ($transaction) $transaction->delete();

                if ($debt) {
                    // Hitung sisa hutang baru (memperhitungkan cicilan yang mungkin sudah ada)
                    $paidAmount = $debt->amount - $debt->remaining;
                    $newRemaining = $grandTotal - $paidAmount;
                    $newStatus = ($newRemaining <= 0) ? 'PAID' : (($paidAmount > 0) ? 'PARTIAL' : 'UNPAID');

                    $debt->update([
                        'contact_id' => $validated['contact_id'],
                        'amount' => $grandTotal,
                        'remaining' => max(0, $newRemaining),
                        'status' => $newStatus,
                    ]);

                    if ($newStatus === 'PAID') $debt->delete();
                    if ($newStatus !== 'UNPAID') $purchase->update(['status' => $newStatus]);
                } else {
                    Debt::create([
                        'user_id' => $request->user()->id,
                        'contact_id' => $validated['contact_id'],
                        'purchase_id' => $purchase->id,
                        'type' => 'PAYABLE',
                        'amount' => $grandTotal,
                        'remaining' => $grandTotal,
                        'status' => 'UNPAID',
                    ]);
                }
            }
        });

        return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil diperbarui.');
    }

    /**
     * Menghapus pembelian.
     */
    public function destroy(Purchase $purchase)
    {
        DB::transaction(function () use ($purchase) {
            // 1. Kembalikan stok
            foreach ($purchase->items as $item) {
                if ($item->stock_id) {
                    $stock = $item->stock;
                    if ($stock) {
                        $currentTotalValue = $stock->qty * $stock->avg_cost;
                        $removedValue = $item->qty * $item->price;
                        $newQty = $stock->qty - $item->qty;
                        $newTotalValue = $currentTotalValue - $removedValue;
                        $newAvgCost = ($newQty > 0) ? $newTotalValue / $newQty : 0;

                        $stock->update([
                            'qty' => $newQty,
                            'avg_cost' => $newAvgCost,
                        ]);
                    }
                }
            }

            // 2. Hapus catatan keuangan terkait
            $transactions = Transaction::where('purchase_id', $purchase->id)->get();
            foreach ($transactions as $transaction) {
                $transaction->delete(); // Ini akan mentrigger TransactionObserver@deleted
            }
            $debts = Debt::where('purchase_id', $purchase->id)->get();
            foreach ($debts as $debt) {
                $debt->delete();
            }

            // 3. Hapus pembelian (items akan terhapus otomatis via cascade)
            $purchase->delete();
        });

        return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil dihapus.');
    }

    /**
     * Menyimpan pembayaran hutang.
     */
    public function payment(Request $request, Purchase $purchase)
    {
        $debt = $purchase->debt;
        if (!$debt) {
            return redirect()->back()->with('error', 'Data hutang tidak ditemukan.');
        }

        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'transaction_date' => 'required|date',
            'amount' => ['required', 'numeric', 'min:1', "max:{$debt->remaining}"],
            'note' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $purchase, $debt, $validated) {
            // 1. Buat Transaksi Pengeluaran (EXPENSE)
            Transaction::create([
                'user_id' => $request->user()->id,
                'account_id' => $validated['account_id'],
                'category_id' => $validated['category_id'],
                'purchase_id' => $purchase->id,
                'debt_id' => $debt->id,
                'type' => 'EXPENSE',
                'amount' => $validated['amount'],
                'transaction_date' => $validated['transaction_date'],
                'description' => "Bayar hutang ({$purchase->reference_number})" . ($validated['note'] ? " - {$validated['note']}" : ""),
            ]);

            // 2. Update status Hutang & Pembelian
            $debt->remaining -= $validated['amount'];
            $newStatus = ($debt->remaining <= 0.01) ? 'PAID' : 'PARTIAL'; // Toleransi float

            $debt->update(['status' => $newStatus, 'remaining' => max(0, $debt->remaining)]);
            $purchase->update(['status' => $newStatus]);
        });

        return redirect()->route('purchases.index')->with('success', 'Pembayaran hutang berhasil dicatat.');
    }
}
