<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index()
    {
        return Inertia::render('Accounts/Index', [
            'accounts' => Account::latest()->get(),
            // Hitung total saldo semua akun untuk ditampilkan di header
            'totalBalance' => Account::sum('balance'),
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
                    'user_id' => $request->user()->id,
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $account->update($validated);

        return redirect()->back()->with('success', 'Nama akun diperbarui.');
    }

    public function destroy(Account $account)
    {
        // Opsional: Cek apakah ada transaksi sebelum hapus?
        // Untuk sekarang kita pakai cascade delete di database, jadi aman.
        $account->delete();

        return redirect()->back()->with('success', 'Akun dihapus.');
    }
}
