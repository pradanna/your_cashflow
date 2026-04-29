<?php

namespace App\Http\Controllers;

use App\Services\AI\GeminiService;
use Illuminate\Http\Request;
use App\Models\Category;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Item;
use App\Models\SupplierItem;

class AIController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    public function parse(Request $request)
    {
        $request->validate([
            'text' => 'required|string|max:500',
        ]);

        try {
            // Ambil daftar kategori, akun, kontak, dan MASTER STOK
            $categories = Category::where('user_id', auth()->id())->pluck('name')->toArray();
            $accounts = Account::where('user_id', auth()->id())->pluck('name')->toArray();
            $contacts = Contact::where('user_id', auth()->id())->pluck('name')->toArray();
            
            // Ambil data stok (Katalog Barang/Jasa)
            $items = Item::where('user_id', auth()->id())->get(['name', 'price'])->toArray();

            // Ambil data Supplier Items (Master Modal)
            $supplierItems = SupplierItem::where('user_id', auth()->id())
                ->with('contact:id,name')
                ->get()
                ->map(fn($si) => [
                    'name' => $si->name,
                    'price' => $si->price,
                    'supplier' => $si->contact?->name
                ])->toArray();

            $result = $this->geminiService->parseTransactionText(
                $request->text, 
                $categories, 
                $accounts,
                $contacts,
                $items,
                $supplierItems
            );

            if (!$result || isset($result['error'])) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Gagal memproses teks.',
                ], 422);
            }

            // Mencocokkan Kategori
            $category = Category::where('user_id', auth()->id())
                ->where('name', 'like', '%' . ($result['category_name'] ?? '') . '%')
                ->first();

            // Mencocokkan Akun
            $account = null;
            if (isset($result['account_name'])) {
                $account = Account::where('user_id', auth()->id())
                    ->where('name', 'like', '%' . $result['account_name'] . '%')
                    ->first();
            }

            if (!$account) {
                $account = Account::where('user_id', auth()->id())->first();
            }

            // Mencocokkan Kontak (Customer/Supplier)
            $contact = null;
            if (isset($result['contact_name']) && $result['contact_name'] !== null) {
                $contact = Contact::where('user_id', auth()->id())
                    ->where('name', 'like', '%' . $result['contact_name'] . '%')
                    ->first();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'type' => $result['type'],
                    'amount' => $result['amount'],
                    'category_id' => $category?->id,
                    'category_name' => $category?->name ?? $result['category_name'],
                    'category_matched' => $category ? true : false,
                    'account_id' => $account?->id,
                    'account_name' => $account?->name,
                    'contact_id' => $contact?->id,
                    'contact_name' => $contact?->name ?? $result['contact_name'],
                    'contact_matched' => $contact ? true : false,
                    'description' => $result['description'],
                    'items' => collect($result['items'] ?? [])->map(fn($item) => [
                        'item_name' => $item['name'] ?? ($item['item_name'] ?? 'Unnamed Item'),
                        'qty' => $item['qty'] ?? 1,
                        'price' => $item['price'] ?? 0,
                    ])->toArray(),
                    'linked_purchases' => collect($result['linked_purchases'] ?? [])->map(function($lp) {
                        $supplier = Contact::where('name', 'like', '%' . $lp['supplier_name'] . '%')
                            ->whereIn('type', ['SUPPLIER', 'BOTH'])
                            ->first();
                        return array_merge($lp, [
                            'supplier_id' => $supplier?->id,
                            'supplier_matched' => $supplier ? true : false
                        ]);
                    })->toArray(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
