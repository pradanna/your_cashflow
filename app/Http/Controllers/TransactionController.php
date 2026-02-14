<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class TransactionController extends Controller
{
    /**
     * Menampilkan halaman Pemasukan (Income).
     */
    public function income(Request $request)
    {
        $user = $request->user();
        $query = Transaction::query()
            ->where('user_id', $user->id)
            ->where('type', 'INCOME')
            ->with(['account', 'category', 'order.contact', 'order.purchases', 'debt.contact']);

        // Filter: Date Range (Default: Hari ini)
        $startDate = $request->input('date_start', date('Y-m-d'));
        $endDate = $request->input('date_end', date('Y-m-d'));

        $query->whereDate('transaction_date', '>=', $startDate)
            ->whereDate('transaction_date', '<=', $endDate);

        // Filter: Account
        if ($request->account_id) {
            $query->where('account_id', $request->account_id);
        }

        // Filter: Customer (Via Order atau Debt)
        if ($request->contact_id) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('order', fn($q2) => $q2->where('contact_id', $request->contact_id))
                    ->orWhereHas('debt', fn($q3) => $q3->where('contact_id', $request->contact_id));
            });
        }

        // Hitung Total Pemasukan (Sesuai Filter)
        $totalIncome = $query->sum('amount');

        // Pagination
        $transactions = $query->latest('transaction_date')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        // Data untuk Dropdown Filter & Modal
        $accounts = Account::where('user_id', $user->id)->orderBy('name')->get();
        $categories = Category::where('user_id', $user->id)->where('type', 'INCOME')->orderBy('name')->get();
        $contacts = Contact::where('user_id', $user->id)->whereIn('type', ['CUSTOMER', 'BOTH'])->orderBy('name')->get();
        $suppliers = Contact::where('user_id', $user->id)->whereIn('type', ['SUPPLIER', 'BOTH'])->orderBy('name')->get();

        return Inertia::render('Transactions/Income', [
            'transactions' => $transactions,
            'totalIncome' => $totalIncome,
            'accounts' => $accounts,
            'categories' => $categories,
            'contacts' => $contacts,
            'suppliers' => $suppliers,
            'filters' => [
                'date_start' => $startDate,
                'date_end' => $endDate,
                'account_id' => $request->account_id,
                'contact_id' => $request->contact_id,
            ]
        ]);
    }

    /**
     * Menampilkan halaman Pengeluaran (Expense).
     */
    public function expense(Request $request)
    {
        $user = $request->user();
        $query = Transaction::query()
            ->where('user_id', $user->id)
            ->where('type', 'EXPENSE')
            ->with(['account', 'category', 'purchase.contact', 'purchase.order', 'debt.contact']);

        // Filter: Date Range (Default: Hari ini)
        $startDate = $request->input('date_start', date('Y-m-d'));
        $endDate = $request->input('date_end', date('Y-m-d'));

        $query->whereDate('transaction_date', '>=', $startDate)
            ->whereDate('transaction_date', '<=', $endDate);

        // Filter: Account
        if ($request->account_id) {
            $query->where('account_id', $request->account_id);
        }

        // Filter: Supplier (Via Purchase atau Debt)
        if ($request->contact_id) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('purchase', fn($q2) => $q2->where('contact_id', $request->contact_id))
                    ->orWhereHas('debt', fn($q3) => $q3->where('contact_id', $request->contact_id));
            });
        }

        // Hitung Total Pengeluaran (Sesuai Filter)
        $totalExpense = $query->sum('amount');

        // Pagination
        $transactions = $query->latest('transaction_date')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        // Data untuk Dropdown Filter & Modal
        $accounts = Account::where('user_id', $user->id)->orderBy('name')->get();
        $categories = Category::where('user_id', $user->id)->where('type', 'EXPENSE')->orderBy('name')->get();
        $contacts = Contact::where('user_id', $user->id)->whereIn('type', ['SUPPLIER', 'BOTH'])->orderBy('name')->get();

        return Inertia::render('Transactions/Expense', [
            'transactions' => $transactions,
            'totalExpense' => $totalExpense,
            'accounts' => $accounts,
            'categories' => $categories,
            'contacts' => $contacts,
            'filters' => [
                'date_start' => $startDate,
                'date_end' => $endDate,
                'account_id' => $request->account_id,
                'contact_id' => $request->contact_id,
            ]
        ]);
    }

    /**
     * Menyimpan transaksi baru (Income/Expense).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0.01',
            'transaction_date' => 'required|date',
            'description' => 'nullable|string|max:255',
            'type' => 'required|in:INCOME,EXPENSE',
        ]);

        $request->user()->transactions()->create($validated);

        return redirect()->back()->with('success', 'Transaksi berhasil disimpan.');
    }

    /**
     * Memperbarui transaksi.
     */
    public function update(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== $request->user()->id) abort(403);

        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0.01',
            'transaction_date' => 'required|date',
            'description' => 'nullable|string|max:255',
        ]);

        $transaction->update($validated);

        return redirect()->back()->with('success', 'Transaksi berhasil diperbarui.');
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== $request->user()->id) abort(403);
        $transaction->delete();
        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }

    /**
     * Mencetak Invoice Order ke PDF.
     */
    public function printInvoice(Order $order)
    {
        $order->load(['contact', 'items']);
        $pdf = Pdf::loadView('pdf.invoice', ['order' => $order]);
        return $pdf->stream('Invoice-' . str_replace('/', '-', $order->invoice_number) . '.pdf');
    }
}
