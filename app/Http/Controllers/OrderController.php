<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Debt;
use App\Models\Item;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Stock;
use App\Models\SupplierItem;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Menampilkan daftar order dengan filter.
     */
    public function index(Request $request)
    {
        $query = Order::query()
            ->where('user_id', $request->user()->id)
            ->with(['contact', 'items', 'transaction.account', 'debt', 'purchases']); // Eager load transaction.account

        // Filter: Search (Invoice / Customer Name)
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice_number', 'like', '%' . $request->search . '%')
                    ->orWhereHas('contact', function ($q2) use ($request) {
                        $q2->where('name', 'like', '%' . $request->search . '%');
                    });
            });
        }

        // Filter: Status
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Filter: Date Range (Default: Kemarin sampai Hari ini)
        $startDate = $request->input('date_start', date('Y-m-d', strtotime('yesterday')));
        $endDate = $request->input('date_end', date('Y-m-d'));

        $query->whereDate('transaction_date', '>=', $startDate)
            ->whereDate('transaction_date', '<=', $endDate);

        // Sorting & Pagination
        $orders = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Data for Create Modal
        $contacts = Contact::where('user_id', $request->user()->id)
            ->whereIn('type', ['CUSTOMER', 'BOTH'])
            ->orderBy('name')
            ->get();

        $items = Item::where('user_id', $request->user()->id)
            ->with('contact')
            ->orderBy('name')
            ->get();

        $accounts = Account::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        $categories = Category::where('user_id', $request->user()->id)
            ->where('type', 'INCOME')
            ->orderBy('name')
            ->get();

        $suppliers = Contact::where('user_id', $request->user()->id)
            ->whereIn('type', ['SUPPLIER', 'BOTH'])
            ->orderBy('name')
            ->get();

        $stocks = Stock::where('user_id', $request->user()->id)->orderBy('name')->get();
        $supplierItems = SupplierItem::where('user_id', $request->user()->id)->orderBy('name')->get();

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'date_start' => $startDate,
                'date_end' => $endDate,
            ],
            'contacts' => $contacts,
            'items' => $items,
            'accounts' => $accounts,
            'categories' => $categories,
            'suppliers' => $suppliers,
            'stocks' => $stocks,
            'supplierItems' => $supplierItems,
        ]);
    }

    /**
     * Menyimpan order baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'contact_id' => 'nullable|required_if:status,UNPAID|exists:contacts,id',
            'transaction_date' => 'required|date',
            'status' => 'required|in:UNPAID,PAID',
            'note' => 'nullable|string',
            'description' => 'nullable|string',
            'account_id' => 'nullable|required_if:status,PAID|exists:accounts,id',
            'category_id' => 'nullable|required_if:status,PAID|exists:categories,id',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'nullable|exists:items,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            // Tambahkan validasi untuk Linked Purchases (Modal per Nota)
            'linked_purchases' => 'nullable|array',
            'linked_purchases.*.item_name' => 'required|string|max:255',
            'linked_purchases.*.supplier_id' => 'nullable|required_if:linked_purchases.*.status,UNPAID|exists:contacts,id',
            'linked_purchases.*.qty' => 'required|numeric|min:0.01',
            'linked_purchases.*.amount' => 'required|numeric|min:0',
            'linked_purchases.*.status' => 'nullable|in:PAID,UNPAID',
        ]);

        DB::transaction(function () use ($validated, $request) {
            // ... (Invoice generation logic remains same) ...
            $dateStr = date('Ymd', strtotime($validated['transaction_date']));
            $count = Order::where('user_id', $request->user()->id)
                ->whereDate('created_at', now())
                ->count() + 1;

            $invoiceNumber = 'INV/' . $dateStr . '/' . str_pad($count, 4, '0', STR_PAD_LEFT);

            while (Order::where('invoice_number', $invoiceNumber)->exists()) {
                $count++;
                $invoiceNumber = 'INV/' . $dateStr . '/' . str_pad($count, 4, '0', STR_PAD_LEFT);
            }

            // Calculate Grand Total Sale
            $grandTotal = collect($validated['items'])->sum(fn($item) => $item['qty'] * $item['price']);

            $order = Order::create([
                'user_id' => $request->user()->id,
                'contact_id' => $validated['contact_id'],
                'invoice_number' => $invoiceNumber,
                'transaction_date' => $validated['transaction_date'],
                'grand_total' => $grandTotal,
                'status' => $validated['status'],
                'note' => $validated['note'] ?? $validated['description'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'item_id' => $item['item_id'] ?? null,
                    'item_name' => $item['item_name'],
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                    'subtotal' => $item['qty'] * $item['price'],
                ]);
            }

            // PROSES LINKED PURCHASES (MODAL OTOMATIS)
            if (!empty($validated['linked_purchases'])) {
                foreach ($validated['linked_purchases'] as $lp) {
                    $lpStatus = $lp['status'] ?? 'PAID';

                    // Create Purchase Header
                    $purchase = \App\Models\Purchase::create([
                        'user_id' => $request->user()->id,
                        'order_id' => $order->id, // LINK KE ORDER INI
                        'contact_id' => $lp['supplier_id'] ?? null,
                        'reference_number' => 'AUTO/' . $order->invoice_number,
                        'transaction_date' => $validated['transaction_date'],
                        'grand_total' => $lp['amount'],
                        'status' => $lpStatus,
                        'note' => "Modal otomatis dari Magic Input untuk Order " . $order->invoice_number,
                    ]);

                    // Create Purchase Item
                    $qty = max($lp['qty'] ?? 1, 0.01);
                    \App\Models\PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'item_name' => $lp['item_name'],
                        'qty' => $qty,
                        'price' => round($lp['amount'] / $qty, 2),
                        'subtotal' => $lp['amount'],
                    ]);

                    if ($lpStatus === 'PAID') {
                        // Buat Transaksi Pengeluaran (EXPENSE) untuk modal ini
                        \App\Models\Transaction::create([
                            'user_id' => $request->user()->id,
                            'account_id' => $validated['account_id'] ?? \App\Models\Account::where('user_id', $request->user()->id)->first()?->id,
                            'category_id' => \App\Models\Category::where('user_id', $request->user()->id)->where('type', 'EXPENSE')->first()?->id,
                            'purchase_id' => $purchase->id,
                            'type' => 'EXPENSE',
                            'amount' => $lp['amount'],
                            'transaction_date' => $validated['transaction_date'],
                            'description' => "Biaya Modal: " . $lp['item_name'] . " untuk " . $order->invoice_number,
                        ]);
                    } else {
                        // Buat Hutang ke Supplier
                        \App\Models\Debt::create([
                            'user_id' => $request->user()->id,
                            'contact_id' => $lp['supplier_id'],
                            'purchase_id' => $purchase->id,
                            'type' => 'PAYABLE', // Hutang kita ke supplier
                            'amount' => $lp['amount'],
                            'remaining' => $lp['amount'],
                            'status' => 'UNPAID',
                        ]);
                    }
                }
            }

            // LOGIKA PEMBAYARAN
            if ($validated['status'] === 'PAID') {
                // 1. Jika Lunas -> Buat Transaksi Pemasukan (INCOME)
                $itemSummary = collect($validated['items'])->map(function ($i) {
                    return $i['item_name'] . ' (' . $i['qty'] . ')';
                })->join(', ');

                Transaction::create([
                    'user_id' => $request->user()->id,
                    'account_id' => $validated['account_id'],
                    'category_id' => $validated['category_id'],
                    'order_id' => $order->id,
                    'type' => 'INCOME',
                    'amount' => $grandTotal,
                    'transaction_date' => $validated['transaction_date'],
                    'description' => "Penjualan " . $order->invoice_number . ". Items: " . $itemSummary,
                ]);
            } elseif ($validated['status'] === 'UNPAID') {
                // 2. Jika Belum Lunas -> Catat Piutang (RECEIVABLE)
                Debt::create([
                    'user_id' => $request->user()->id,
                    'contact_id' => $validated['contact_id'], // Wajib ada jika hutang
                    'order_id' => $order->id,
                    'type' => 'RECEIVABLE', // Piutang (Orang lain berhutang ke kita)
                    'amount' => $grandTotal,
                    'remaining' => $grandTotal,
                    'status' => 'UNPAID',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Order berhasil dibuat.');
    }

    /**
     * Memperbarui order.
     */
    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'contact_id' => 'nullable|required_if:status,UNPAID|exists:contacts,id',
            'transaction_date' => 'required|date',
            'status' => 'required|in:UNPAID,PAID',
            'note' => 'nullable|string',
            'account_id' => 'nullable|required_if:status,PAID|exists:accounts,id',
            'category_id' => 'nullable|required_if:status,PAID|exists:categories,id',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'nullable|exists:items,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            'linked_purchases' => 'nullable|array',
            'linked_purchases.*.item_name' => 'required|string|max:255',
            'linked_purchases.*.supplier_id' => 'nullable|exists:contacts,id',
            'linked_purchases.*.qty' => 'required|numeric|min:0.01',
            'linked_purchases.*.amount' => 'required|numeric|min:0',
            'linked_purchases.*.status' => 'nullable|in:PAID,UNPAID',
        ]);

        DB::transaction(function () use ($validated, $request, $order) {
            // 1. Calculate Grand Total
            $grandTotal = 0;
            foreach ($validated['items'] as $item) {
                $grandTotal += ($item['qty'] * $item['price']);
            }

            // 2. Update Order
            $order->update([
                'contact_id' => $validated['contact_id'],
                'transaction_date' => $validated['transaction_date'],
                'grand_total' => $grandTotal,
                'status' => $validated['status'],
                'note' => $validated['note'],
            ]);

            // 3. Sync Items (Delete & Recreate)
            $order->items()->delete();
            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'item_id' => $item['item_id'] ?? null,
                    'item_name' => $item['item_name'],
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                    'subtotal' => $item['qty'] * $item['price'],
                ]);
            }

            // 4. Handle Financials
            $transaction = Transaction::where('order_id', $order->id)->first();
            $debt = Debt::where('order_id', $order->id)->first();

            if ($validated['status'] === 'PAID') {
                // Should have Transaction, No Debt
                if ($debt) $debt->delete();

                $itemSummary = collect($validated['items'])->map(function ($i) {
                    return $i['item_name'] . ' (' . $i['qty'] . ')';
                })->join(', ');
                $desc = "Penjualan " . $order->invoice_number . ". Items: " . $itemSummary;

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
                        'order_id' => $order->id,
                        'type' => 'INCOME',
                        'amount' => $grandTotal,
                        'transaction_date' => $validated['transaction_date'],
                        'description' => $desc,
                    ]);
                }
            } else {
                // UNPAID -> Should have Debt, No Transaction
                if ($transaction) $transaction->delete();

                if ($debt) {
                    // Hitung jumlah yang sudah dibayar pada piutang lama.
                    $paidAmount = $debt->amount - $debt->remaining;
                    $newRemaining = $grandTotal - $paidAmount;

                    // Tentukan status baru berdasarkan sisa tagihan.
                    $newStatus = ($newRemaining <= 0) ? 'PAID' : (($paidAmount > 0) ? 'PARTIAL' : 'UNPAID');

                    $debt->update([
                        'contact_id' => $validated['contact_id'],
                        'amount' => $grandTotal,
                        'remaining' => max(0, $newRemaining), // Pastikan tidak negatif
                        'status' => $newStatus,
                    ]);

                    // Jika status baru menjadi LUNAS, hapus data piutang karena sudah tidak relevan.
                    if ($newStatus === 'PAID') $debt->delete();
                } else {
                    Debt::create([
                        'user_id' => $request->user()->id,
                        'contact_id' => $validated['contact_id'],
                        'order_id' => $order->id,
                        'type' => 'RECEIVABLE',
                        'amount' => $grandTotal,
                        'remaining' => $grandTotal,
                        'status' => 'UNPAID',
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Order berhasil diperbarui.');
    }

    /**
     * Menghapus order.
     */
    public function destroy(Order $order)
    {
        DB::transaction(function () use ($order) {
            // 1. Kembalikan stok (Jangan lupa kembalikan Qty ke tabel stocks)
            foreach ($order->items as $item) {
                if ($item->stock_id) {
                    $item->stock->increment('qty', $item->qty);
                }
            }

            // 2. Hapus Transaksi terkait satu per satu (Agar Observer terpanggil)
            $transactions = Transaction::where('order_id', $order->id)->get();
            foreach ($transactions as $transaction) {
                // Ini akan memicu TransactionObserver@deleted
                // Saldo akun akan dikurangi otomatis (karena Income dihapus)
                $transaction->delete();
            }

            // 3. Hapus catatan Piutang terkait satu per satu
            $debts = Debt::where('order_id', $order->id)->get();
            foreach ($debts as $debt) {
                $debt->delete();
            }

            // 4. Hapus order utama
            $order->delete();
        });

        return redirect()->back()->with('success', 'Order dan data terkait berhasil dihapus.');
    }

    /**
     * Menyimpan pembayaran untuk order (Pelunasan Piutang).
     */
    public function payment(Request $request, Order $order)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'transaction_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'note' => 'nullable|string',
        ]);

        $debt = $order->debt;

        if (!$debt) {
            return redirect()->back()->with('error', 'Data piutang tidak ditemukan untuk order ini.');
        }

        if ($validated['amount'] > $debt->remaining) {
            return redirect()->back()->withErrors(['amount' => 'Nominal melebihi sisa piutang.']);
        }

        DB::transaction(function () use ($request, $order, $debt, $validated) {
            // 1. Create Transaction (INCOME)
            Transaction::create([
                'user_id' => $request->user()->id,
                'account_id' => $validated['account_id'],
                'category_id' => $validated['category_id'],
                'order_id' => $order->id,
                'debt_id' => $debt->id,
                'type' => 'INCOME',
                'amount' => $validated['amount'],
                'transaction_date' => $validated['transaction_date'],
                'description' => "Pembayaran " . $order->invoice_number . ($validated['note'] ? " ({$validated['note']})" : ""),
            ]);

            // 2. Update Debt & Order Status
            $debt->remaining -= $validated['amount'];

            // Cek lunas (toleransi floating point)
            $newStatus = ($debt->remaining <= 0) ? 'PAID' : 'PARTIAL';

            $debt->update(['status' => $newStatus, 'remaining' => max(0, $debt->remaining)]);
            $order->update(['status' => $newStatus]);
        });

        return redirect()->back()->with('success', 'Pembayaran berhasil dicatat.');
    }

    /**
     * Menampilkan form tambah order.
     */
    public function create()
    {
        // Placeholder: Nanti diisi dengan logika pengambilan data Contact/Stock untuk form
        return Inertia::render('Orders/Create');
    }

    /**
     * Menampilkan detail order.
     */
    public function show(Order $order)
    {
        // Security check
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        // Load detail items beserta relasi stock/item-nya
        $order->load(['contact', 'items.stock', 'items.item', 'purchases']);

        return Inertia::render('Orders/Show', [
            'order' => $order,
        ]);
    }
}
