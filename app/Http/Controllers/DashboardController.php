<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Debt;
use App\Models\Stock;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Liquid Assets (Total Saldo Akun)
        $accounts = Account::where('user_id', $user->id)->get();
        $totalLiquid = $accounts->sum('balance');

        // 2. Hutang & Piutang (Active)
        // Mengambil data hutang/piutang yang belum lunas (UNPAID/PARTIAL)
        $activeDebts = Debt::where('user_id', $user->id)
            ->whereIn('status', ['UNPAID', 'PARTIAL'])
            ->with('contact') // Eager load contact untuk nama
            ->get();

        $totalReceivable = $activeDebts->where('type', 'RECEIVABLE')->sum('remaining');
        $totalPayable = $activeDebts->where('type', 'PAYABLE')->sum('remaining');

        // 3. Stock Value (Inventory Asset)
        // Nilai Aset Stok = Quantity * Average Cost
        $stocks = Stock::where('user_id', $user->id)->get();
        $totalStockValue = $stocks->sum(function ($stock) {
            return $stock->qty * $stock->selling_price;
        });

        // --- KPI CALCULATIONS ---

        // Posisi Kas Bersih = (Akun + Piutang) - Hutang
        $netCashPosition = ($totalLiquid + $totalReceivable) - $totalPayable;

        // Kekayaan Global = Real (Akun) + Estimasi (Piutang) + Stock
        $globalWealth = $totalLiquid + $totalReceivable + $totalStockValue;

        return Inertia::render('Dashboard', [
            'stats' => [
                'liquid_assets' => $totalLiquid,
                'net_cash_position' => $netCashPosition,
                'global_wealth' => $globalWealth,
                'total_stock_value' => $totalStockValue,
                'total_receivable' => $totalReceivable,
                'total_payable' => $totalPayable,
            ],
            'accounts' => $accounts,
            'payables' => $activeDebts->where('type', 'PAYABLE')->values(),
            'receivables' => $activeDebts->where('type', 'RECEIVABLE')->values(),
            'stocks' => $stocks->sortByDesc(fn($s) => $s->qty * $s->avg_cost)->take(5)->values(),
        ]);
    }
}
