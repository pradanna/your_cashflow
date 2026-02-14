<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Debt;
use App\Models\Transaction;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function dailyCashflow(Request $request)
    {
        $user = $request->user();
        $startDate = $request->input('date_start', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('date_end', now()->endOfMonth()->format('Y-m-d'));

        // 1. Hitung Saldo Awal (Total Income - Total Expense sebelum startDate)
        $openingBalance = Transaction::where('user_id', $user->id)
            ->where('transaction_date', '<', $startDate)
            ->selectRaw("SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as balance")
            ->value('balance') ?? 0;

        // 2. Ambil Transaksi dalam periode (Group by Date)
        // Asumsi transaction_date tersimpan sebagai YYYY-MM-DD
        $transactions = Transaction::where('user_id', $user->id)
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->get()
            ->groupBy(fn($item) => substr($item->transaction_date, 0, 10));

        // 3. Ambil Hutang/Piutang dalam periode (Group by Created Date)
        $debts = Debt::where('user_id', $user->id)
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->get()
            ->groupBy(fn($item) => $item->created_at->format('Y-m-d'));

        // 4. Loop setiap hari dalam periode untuk menyusun laporan
        $period = CarbonPeriod::create($startDate, $endDate);
        $reportData = [];
        $currentBalance = $openingBalance;

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');

            // Data Transaksi Hari Ini
            $dayTrans = isset($transactions[$dateStr]) ? $transactions[$dateStr] : collect([]);
            $income = $dayTrans->where('type', 'INCOME')->sum('amount');
            $expense = $dayTrans->where('type', 'EXPENSE')->sum('amount');

            // Data Hutang/Piutang Hari Ini (Yang baru tercatat)
            $dayDebts = isset($debts[$dateStr]) ? $debts[$dateStr] : collect([]);
            $receivable = $dayDebts->where('type', 'RECEIVABLE')->sum('amount');
            $payable = $dayDebts->where('type', 'PAYABLE')->sum('amount');

            $netCash = $income - $expense;
            $currentBalance += $netCash;

            $cashEquity = $currentBalance + $receivable - $payable;

            $reportData[] = compact('dateStr', 'income', 'expense', 'netCash', 'receivable', 'payable', 'currentBalance', 'cashEquity');
        }

        return Inertia::render('Reports/DailyCashflow', [
            'reportData' => $reportData,
            'filters' => compact('startDate', 'endDate'),
            'openingBalance' => $openingBalance,
            'closingBalance' => $currentBalance,
        ]);
    }

    /**
     * Laporan Riwayat Hutang & Piutang (General).
     */
    public function debts(Request $request)
    {
        $user = $request->user();
        $startDate = $request->input('date_start', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('date_end', now()->endOfMonth()->format('Y-m-d'));
        $status = $request->input('status', 'ALL'); // ALL, UNPAID, PARTIAL, PAID
        $type = $request->input('type', 'ALL'); // ALL, PAYABLE, RECEIVABLE

        $query = Debt::where('user_id', $user->id)
            ->with(['contact', 'order', 'purchase'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate]);

        if ($status !== 'ALL') $query->where('status', $status);
        if ($type !== 'ALL') $query->where('type', $type);

        $debts = $query->latest()->get();

        return Inertia::render('Reports/DebtHistory', [
            'debts' => $debts,
            'filters' => compact('startDate', 'endDate', 'status', 'type'),
        ]);
    }

    /**
     * Laporan Tagihan per Customer (Statement of Account).
     */
    public function customerStatement(Request $request)
    {
        $user = $request->user();
        $startDate = $request->input('date_start', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('date_end', now()->endOfMonth()->format('Y-m-d'));
        $contactId = $request->input('contact_id');

        $customers = Contact::where('user_id', $user->id)
            ->whereIn('type', ['CUSTOMER', 'BOTH'])
            ->orderBy('name')
            ->get();

        $statement = null;

        if ($contactId) {
            $contact = $customers->find($contactId);

            // Ambil piutang (Receivable) dalam periode
            $invoices = Debt::where('user_id', $user->id)
                ->where('contact_id', $contactId)
                ->where('type', 'RECEIVABLE')
                ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
                ->with(['order.items'])
                ->orderBy('created_at')
                ->get();

            $statement = [
                'contact' => $contact,
                'invoices' => $invoices,
                'total_amount' => $invoices->sum('amount'),
                'total_remaining' => $invoices->sum('remaining'),
            ];
        }

        return Inertia::render('Reports/CustomerStatement', [
            'customers' => $customers,
            'filters' => compact('startDate', 'endDate', 'contactId'),
            'statement' => $statement,
        ]);
    }

    /**
     * Export Customer Statement ke PDF.
     */
    public function customerStatementPdf(Request $request)
    {
        $user = $request->user();
        $startDate = $request->input('date_start', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('date_end', now()->endOfMonth()->format('Y-m-d'));
        $contactId = $request->input('contact_id');

        if (!$contactId) {
            return redirect()->back();
        }

        $contact = Contact::where('user_id', $user->id)->find($contactId);

        if (!$contact) {
            abort(404);
        }

        $invoices = Debt::where('user_id', $user->id)
            ->where('contact_id', $contactId)
            ->where('type', 'RECEIVABLE')
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->with(['order.items'])
            ->orderBy('created_at')
            ->get();

        $data = [
            'contact' => $contact,
            'invoices' => $invoices,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'total_remaining' => $invoices->sum('remaining'),
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.customer_statement', $data);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('Statement-' . $contact->name . '.pdf');
    }

    /**
     * Laporan Ringkasan Hutang Piutang per Kontak (Summary).
     */
    public function debtSummary(Request $request)
    {
        $user = $request->user();
        $search = $request->input('search');

        // Query: Ambil Debt yang belum lunas (remaining > 0) dengan relasi detail
        $query = Debt::where('user_id', $user->id)
            ->where('remaining', '>', 0)
            ->with(['contact', 'order.items', 'purchase.items']);

        if ($search) {
            $query->whereHas('contact', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $allDebts = $query->latest()->get();

        // Grouping data manual collection
        $grouped = $allDebts->groupBy(function ($item) {
            return $item->type . '-' . $item->contact_id;
        });

        $results = $grouped->map(function ($items) {
            $first = $items->first();
            return [
                'contact_id' => $first->contact_id,
                'type' => $first->type,
                'contact_name' => $first->contact->name ?? 'Unknown',
                'total_remaining' => $items->sum('remaining'),
                'transaction_count' => $items->count(),
                'details' => $items->values(), // Sertakan detail untuk modal
            ];
        })->values();

        return Inertia::render('Reports/DebtSummary', [
            'payables' => $results->where('type', 'PAYABLE')->values(),
            'receivables' => $results->where('type', 'RECEIVABLE')->values(),
            'filters' => ['search' => $search],
        ]);
    }
}
