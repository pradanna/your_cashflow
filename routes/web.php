<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DebtController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\TransactionController;
use Inertia\Inertia;

Route::get('/', function () {
    if (Illuminate\Support\Facades\Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});


Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Orders Routes

    Route::resource('accounts', AccountController::class);
    Route::resource('contacts', ContactController::class);
    Route::resource('catalogs', CatalogController::class)
        ->except(['store', 'create', 'edit', 'update', 'destroy']);
    Route::post('/items/store', [CatalogController::class, 'storeItem'])
        ->name('items.store_custom');

    // Route untuk simpan Item Supplier
    Route::post('/supplier-items/store', [CatalogController::class, 'storeSupplierItem'])
        ->name('supplier-items.store_custom');

    Route::resource('stocks', StockController::class);
    Route::post('/stocks/{stock}/adjust', [StockController::class, 'adjust'])->name('stocks.adjust');

    Route::resource('categories', CategoryController::class);

    // --- 3. TRANSAKSI ---
    Route::resource('orders', OrderController::class);
    Route::post('/orders/{order}/payment', [OrderController::class, 'payment'])->name('orders.payment');

    Route::resource('purchases', PurchaseController::class);
    Route::post('/purchases/{purchase}/payment', [PurchaseController::class, 'payment'])->name('purchases.payment');

    Route::resource('debts', DebtController::class);
    Route::post('/debts/{debt}/payment', [DebtController::class, 'payment'])->name('debts.payment');

    // Khusus Pemasukan & Pengeluaran (Memakai TransactionController tapi beda URL)
    Route::get('/transactions/income', [TransactionController::class, 'income'])->name('transactions.income');
    Route::get('/transactions/expense', [TransactionController::class, 'expense'])->name('transactions.expense');

    // Resource route untuk handle store/update/delete umum
    Route::resource('transactions', TransactionController::class)->except(['index', 'create']);
    Route::get('/transactions/print/{order}', [TransactionController::class, 'printInvoice'])->name('transactions.print_invoice');

    // --- 4. LAPORAN ---
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/daily-cashflow', [ReportController::class, 'dailyCashflow'])->name('daily-cashflow');
        Route::get('/profit-loss', [ReportController::class, 'profitLoss'])->name('profit-loss');
        Route::get('/debts', [ReportController::class, 'debts'])->name('debts');
        Route::get('/statements', [ReportController::class, 'customerStatement'])->name('statements');
        Route::get('/stock-mutations', [ReportController::class, 'stockMutations'])->name('stock-mutations');
        Route::get('/statements/pdf', [ReportController::class, 'customerStatementPdf'])->name('statements.pdf');
    });
});


require __DIR__ . '/auth.php';
