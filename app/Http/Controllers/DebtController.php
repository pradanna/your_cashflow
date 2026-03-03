<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Debt;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DebtController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Default filter values
        $type = $request->input('type', 'PAYABLE'); // Default tab adalah Hutang
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $startDate = $request->input('date_start', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->input('date_end', now()->format('Y-m-d'));
        $status = $request->input('status', 'ALL');
        $show = $request->input('show', 'paginate');

        $query = Debt::query()
            ->where('user_id', $user->id)
            ->where('type', $type)
            ->with(['contact', 'order', 'purchase']);

        // Filter: Search by Contact Name
        if ($request->search) {
            $query->whereHas('contact', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        // Filter: Status
        if ($status !== 'ALL') {
            if ($status === 'UNPAID') {
                // "Belum Lunas" mencakup UNPAID dan PARTIAL
                $query->whereIn('status', ['UNPAID', 'PARTIAL']);
            } else {
                // Untuk 'PAID'
                $query->where('status', $status);
            }
        }

        // Filter: Date Range (based on created_at)
        $query->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        // Sorting
        if ($sortBy === 'contact_name') {
            $query->join('contacts', 'debts.contact_id', '=', 'contacts.id')
                ->orderBy('contacts.name', $sortDir)
                ->select('debts.*'); // Hindari ambiguitas kolom
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = $show === 'all' ? 1000 : 15;
        $debts = $query->paginate($perPage)->withQueryString();

        // Data untuk filter dan modal
        $contactType = ($type === 'PAYABLE') ? ['SUPPLIER', 'BOTH'] : ['CUSTOMER', 'BOTH'];
        $contacts = Contact::where('user_id', $user->id)
            ->whereIn('type', $contactType)
            ->orderBy('name')
            ->get();

        $accounts = Account::where('user_id', $user->id)->orderBy('name')->get();
        $categories = Category::where('user_id', $user->id)->orderBy('name')->get();

        return Inertia::render('Debts/Index', [
            'debts' => $debts,
            'filters' => [
                'type' => $type,
                'search' => $request->search,
                'date_start' => $startDate,
                'date_end' => $endDate,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
                'status' => $status,
                'show' => $show,
            ],
            'contacts' => $contacts,
            'accounts' => $accounts,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contact_id' => 'required|exists:contacts,id',
            'type' => 'required|in:PAYABLE,RECEIVABLE',
            'amount' => 'required|numeric|min:0.01',
            'due_date' => 'nullable|date',
            'note' => 'nullable|string|max:255',
        ]);

        $request->user()->debts()->create([
            'contact_id' => $validated['contact_id'],
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'remaining' => $validated['amount'], // Awalnya, sisa = jumlah total
            'due_date' => $validated['due_date'],
            'status' => 'UNPAID',
            'note' => $validated['note'] ?? null,
        ]);

        $message = $validated['type'] === 'PAYABLE' ? 'Hutang berhasil ditambahkan.' : 'Piutang berhasil ditambahkan.';

        return redirect()->back()->with('success', $message);
    }

    public function update(Request $request, Debt $debt)
    {
        if ($debt->order_id || $debt->purchase_id) {
            return redirect()->back()->with('error', 'Edit harus dilakukan dari sumber transaksi (Order/Purchase).');
        }

        $validated = $request->validate([
            'contact_id' => 'required|exists:contacts,id',
            'amount' => 'required|numeric|min:0.01',
            'due_date' => 'nullable|date',
            'note' => 'nullable|string|max:255',
        ]);

        // Hanya izinkan edit jumlah jika status masih UNPAID untuk simplifikasi
        if ($debt->status !== 'UNPAID' && $debt->amount != $validated['amount']) {
            return redirect()->back()->with('error', 'Tidak bisa mengubah jumlah hutang yang sudah dibayar sebagian/lunas.');
        }

        $debt->update([
            'contact_id' => $validated['contact_id'],
            'amount' => $validated['amount'],
            'remaining' => $validated['amount'], // Reset remaining karena asumsi UNPAID
            'due_date' => $validated['due_date'],
            'note' => $validated['note'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Data hutang berhasil diperbarui.');
    }

    public function destroy(Debt $debt)
    {
        if ($debt->order_id || $debt->purchase_id) {
            return redirect()->back()->with('error', 'Hapus harus dilakukan dari sumber transaksi.');
        }

        if ($debt->status !== 'UNPAID') {
            return redirect()->back()->with('error', 'Tidak bisa menghapus hutang yang sudah ada pembayaran.');
        }

        $debt->delete();
        return redirect()->back()->with('success', 'Data hutang berhasil dihapus.');
    }

    public function payment(Request $request, Debt $debt)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0.01|max:' . $debt->remaining,
            'transaction_date' => 'required|date',
            'note' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $debt, $validated) {
            $trxType = ($debt->type === 'PAYABLE') ? 'EXPENSE' : 'INCOME';
            $descPrefix = ($debt->type === 'PAYABLE') ? 'Pembayaran Hutang' : 'Penerimaan Piutang';

            Transaction::create([
                'user_id' => $request->user()->id,
                'account_id' => $validated['account_id'],
                'category_id' => $validated['category_id'],
                'debt_id' => $debt->id,
                'type' => $trxType,
                'amount' => $validated['amount'],
                'transaction_date' => $validated['transaction_date'],
                'description' => "{$descPrefix} ({$debt->contact->name}) " . ($validated['note'] ?? ''),
            ]);

            $debt->remaining -= $validated['amount'];
            $debt->status = ($debt->remaining <= 0) ? 'PAID' : 'PARTIAL';
            $debt->save();
        });

        return redirect()->back()->with('success', 'Pembayaran berhasil dicatat.');
    }

    public function bulkPayment(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'transaction_date' => 'required|date',
            'debt_ids' => 'required|array',
            'debt_ids.*' => 'required|integer|exists:debts,id',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $user = $request->user();
            $debtsToPay = Debt::where('user_id', $user->id)
                ->whereIn('id', $validated['debt_ids'])
                ->where('status', '!=', 'PAID')
                ->with(['order', 'purchase', 'contact']) // Eager load untuk deskripsi
                ->get();

            if ($debtsToPay->isEmpty()) {
                return; // Tidak ada yang perlu dibayar
            }

            // Tipe hutang/piutang harus seragam, UI sudah memvalidasi via tab
            $firstDebtType = $debtsToPay->first()->type;
            $trxType = ($firstDebtType === 'PAYABLE') ? 'EXPENSE' : 'INCOME';
            $descPrefix = ($firstDebtType === 'PAYABLE') ? 'Pembayaran Hutang' : 'Penerimaan Piutang';

            foreach ($debtsToPay as $debt) {
                // 1. Buat Transaksi untuk pembayaran
                Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $validated['account_id'],
                    'category_id' => $validated['category_id'],
                    'debt_id' => $debt->id,
                    'order_id' => $debt->order_id,
                    'purchase_id' => $debt->purchase_id,
                    'type' => $trxType,
                    'amount' => $debt->remaining, // Bayar lunas sisa tagihan
                    'transaction_date' => $validated['transaction_date'],
                    'description' => "{$descPrefix} ({$debt->contact->name}) - Ref: " . ($debt->order->invoice_number ?? $debt->purchase->reference_number ?? 'Manual'),
                ]);

                // 2. Update status Debt
                $debt->remaining = 0;
                $debt->status = 'PAID';
                $debt->save();

                // 3. Update status Order/Purchase terkait jika ada
                if ($debt->order) $debt->order->update(['status' => 'PAID']);
                if ($debt->purchase) $debt->purchase->update(['status' => 'PAID']);
            }
        });

        return redirect()->back()->with('success', 'Pembayaran untuk ' . count($validated['debt_ids']) . ' tagihan berhasil dicatat.');
    }
}
