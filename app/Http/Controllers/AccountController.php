<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $accountsQuery = Account::where('user_id', $user->owner_id);

        return Inertia::render('Accounts/Index', [
            'accounts' => $accountsQuery->latest()->get(),
            // Hitung total saldo semua akun untuk ditampilkan di header
            'totalBalance' => (clone $accountsQuery)->sum('balance'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'initial_balance' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {
            // 1. Buat Akun (Saldo 0 dulu)
            $account = $request->user()->accounts()->create([
                'name' => $validated['name'],
                'balance' => 0,
            ]);

            // 2. Jika ada saldo awal, catat sebagai Transaksi INCOME
            // Observer akan otomatis meng-update saldo akun menjadi sesuai inputan
            if ($validated['initial_balance'] > 0) {
                Transaction::create([
                    'user_id' => $request->user()->owner_id,
                    'account_id' => $account->id,
                    'type' => 'INCOME',
                    'amount' => $validated['initial_balance'],
                    'transaction_date' => now(),
                    'description' => 'Saldo Awal (Initial Balance)',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Akun berhasil ditambahkan.');
    }

    public function update(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->owner_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $account->update($validated);

        return redirect()->back()->with('success', 'Nama akun diperbarui.');
    }

    public function destroy(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->owner_id) {
            abort(403);
        }

        // Opsional: Cek apakah ada transaksi sebelum hapus?
        // Untuk sekarang kita pakai cascade delete di database, jadi aman.
        $account->delete();

        return redirect()->back()->with('success', 'Akun dihapus.');
    }

    public function adjust(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->owner_id) {
            abort(403);
        }

        $validated = $request->validate([
            'real_balance' => 'required|numeric|min:0',
        ]);

        $realBalance = $validated['real_balance'];
        $currentBalance = $account->balance;
        $diff = $realBalance - $currentBalance;

        if ($diff == 0) {
            return redirect()->back()->with('info', 'Saldo sudah sesuai, tidak ada penyesuaian.');
        }

        $type = $diff > 0 ? 'INCOME' : 'EXPENSE';
        $amount = abs($diff);

        // Cari atau buat kategori PENYESUAIAN
        $category = Category::firstOrCreate(
            ['user_id' => $request->user()->owner_id, 'name' => 'PENYESUAIAN', 'type' => $type],
            ['name' => 'PENYESUAIAN', 'type' => $type]
        );

        DB::transaction(function () use ($request, $account, $type, $amount, $category) {
            Transaction::create([
                'user_id' => $request->user()->owner_id,
                'account_id' => $account->id,
                'category_id' => $category->id,
                'type' => $type,
                'amount' => $amount,
                'transaction_date' => now(),
                'description' => 'Penyesuaian Saldo Kas',
            ]);
        });

        return redirect()->back()->with('success', 'Saldo berhasil disesuaikan.');
    }
}
