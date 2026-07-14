<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\EmployeeController;
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

    // --- 1. OWNER ONLY ROUTES ---
    Route::middleware('role:owner')->group(function () {
        Route::resource('accounts', AccountController::class);
        Route::post('/accounts/{account}/adjust', [AccountController::class, 'adjust'])->name('accounts.adjust');
        
        Route::resource('categories', CategoryController::class);
        
        Route::post('/purchases/{purchase}/payment', [PurchaseController::class, 'payment'])->name('purchases.payment');
        
        Route::post('/debts/bulk-payment', [DebtController::class, 'bulkPayment'])->name('debts.bulk-payment');
        Route::resource('debts', DebtController::class);
        Route::post('/debts/{debt}/payment', [DebtController::class, 'payment'])->name('debts.payment');

        // Khusus Pemasukan & Pengeluaran (Memakai TransactionController tapi beda URL)
        Route::get('/transactions/income', [TransactionController::class, 'income'])->name('transactions.income');
        Route::get('/transactions/expense', [TransactionController::class, 'expense'])->name('transactions.expense');
        // Resource route untuk handle store/update/delete umum
        Route::resource('transactions', TransactionController::class)->except(['index', 'create']);

        // Kelola Karyawan (User Management)
        Route::resource('employees', EmployeeController::class);

        // Katalog & Item Custom (Owner Only)
        Route::resource('catalogs', CatalogController::class);
        Route::post('/items/store', [CatalogController::class, 'storeItem'])->name('items.store_custom');
        Route::put('/items/{item}', [CatalogController::class, 'updateItem'])->name('items.update');
        Route::delete('/items/{item}', [CatalogController::class, 'destroyItem'])->name('items.destroy');

        Route::post('/supplier-items/store', [CatalogController::class, 'storeSupplierItem'])->name('supplier-items.store_custom');
        Route::put('/supplier-items/{supplierItem}', [CatalogController::class, 'updateSupplierItem'])->name('supplier-items.update');
        Route::delete('/supplier-items/{supplierItem}', [CatalogController::class, 'destroySupplierItem'])->name('supplier-items.destroy');

        // --- LAPORAN (OWNER) ---
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/daily-cashflow', [ReportController::class, 'dailyCashflow'])->name('daily-cashflow');
            Route::get('/profit-loss', [ReportController::class, 'profitLoss'])->name('profit-loss');
            Route::get('/debts', [ReportController::class, 'debts'])->name('reports.debts');
            Route::get('/statements', [ReportController::class, 'customerStatement'])->name('statements');
            Route::get('/statements/pdf', [ReportController::class, 'customerStatementPdf'])->name('statements.pdf');
            Route::get('/debt-summary', [ReportController::class, 'debtSummary'])->name('debt-summary');
            Route::get('/debt-summary/print/{contactId}/{type}', [ReportController::class, 'printDebtDetail'])->name('debt-summary.print');
            Route::get('/stock-mutations', [ReportController::class, 'stockMutations'])->name('stock-mutations');
        });
    });

    // --- 2. OWNER & KARYAWAN ROUTES ---
    Route::middleware('role:owner,karyawan')->group(function () {
        Route::resource('contacts', ContactController::class);
        Route::resource('purchases', PurchaseController::class);

        Route::resource('stocks', StockController::class);
        Route::post('/stocks/{stock}/adjust', [StockController::class, 'adjust'])->name('stocks.adjust');

        Route::resource('orders', OrderController::class);
        Route::post('/orders/{order}/payment', [OrderController::class, 'payment'])->name('orders.payment');

        Route::get('/employee-debts', [DebtController::class, 'employeeDebts'])->name('debts.employee');
        Route::post('/employee-debts/{debt}/payment', [DebtController::class, 'employeePayment'])->name('debts.employee_payment');
        Route::post('/employee-debts/bulk-payment/{contact}', [DebtController::class, 'employeeBulkPayment'])->name('debts.employee_bulk_payment');

        Route::get('/transactions/print/{order}', [TransactionController::class, 'printInvoice'])->name('transactions.print_invoice');

        Route::post('/ai/parse', [\App\Http\Controllers\AIController::class, 'parse'])->name('ai.parse');
    });
});

require __DIR__ . '/auth.php';
