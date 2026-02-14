<?php

namespace App\Observers;

use App\Models\Transaction;

class TransactionObserver
{
    /**
     * Handle the Transaction "created" event.
     */
    public function created(Transaction $transaction): void
    {
        $account = $transaction->account;

        if ($transaction->type === 'INCOME') {
            $account->increment('balance', $transaction->amount);
        } else {
            $account->decrement('balance', $transaction->amount);
        }
    }

    /**
     * Handle the Transaction "updated" event.
     */
    public function updated(Transaction $transaction): void
    {
        // Cek jika nominal berubah
        if ($transaction->isDirty('amount')) {
            $selisih = $transaction->amount - $transaction->getOriginal('amount');
            $account = $transaction->account;

            if ($transaction->type === 'INCOME') {
                // Jika Income naik, saldo naik. Jika turun, saldo turun.
                if ($selisih > 0) {
                    $account->increment('balance', $selisih);
                } else {
                    $account->decrement('balance', abs($selisih));
                }
            } else {
                // Jika Expense naik, saldo TURUN.
                if ($selisih > 0) {
                    $account->decrement('balance', $selisih);
                } else {
                    $account->increment('balance', abs($selisih));
                }
            }
        }
    }

    /**
     * Handle the Transaction "deleted" event.
     */
    public function deleted(Transaction $transaction): void
    {
        $account = $transaction->account;

        // Balikkan logic: Kalau hapus Income -> Saldo Kurang
        if ($transaction->type === 'INCOME') {
            $account->decrement('balance', $transaction->amount);
        } else {
            // Kalau hapus Expense -> Saldo Balik (Nambah)
            $account->increment('balance', $transaction->amount);
        }
    }

    /**
     * Handle the Transaction "restored" event.
     */
    public function restored(Transaction $transaction): void
    {
        //
    }

    /**
     * Handle the Transaction "force deleted" event.
     */
    public function forceDeleted(Transaction $transaction): void
    {
        //
    }
}
