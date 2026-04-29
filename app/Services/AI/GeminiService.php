<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key', '');
    }

    /**
     * Parse text natural language menjadi data JSON transaksi.
     * 
     * @param string $text Contoh: "Beli bensin 50rb"
     * @param array $categories Daftar kategori user
     * @param array $accounts Daftar akun user
     * @return array|null Kembalikan array jika sukses, null jika gagal
     */
    public function parseTransactionText(string $text, array $categories = [], array $accounts = [], array $contacts = [], array $items = [], array $supplierItems = []): ?array
    {
        // Cek API Key
        $key = config('services.gemini.key');
        if (empty($key)) {
            Log::error('Gemini API Key is not set in .env');
            throw new \Exception('Gemini API Key belum di-setting di file .env.');
        }

        // Menggunakan model gemini-2.5-flash yang terbukti ada di API Key Anda
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $key;

        // Ubah data menjadi string untuk prompt (Rampingkan agar hemat token)
        $categoryList = empty($categories) ? 'None' : implode(', ', $categories);
        $accountList = empty($accounts) ? 'None' : implode(', ', $accounts);
        $contactList = empty($contacts) ? 'None' : implode(', ', $contacts);
        
        // Hanya kirim field yang benar-benar dibutuhkan AI
        $itemList = empty($items) ? 'None' : json_encode(collect($items)->map(fn($i) => ['n' => $i['name'], 'p' => $i['price']])->toArray());
        $supplierItemList = empty($supplierItems) ? 'None' : json_encode(collect($supplierItems)->map(fn($si) => ['n' => $si['name'], 'p' => $si['price'], 's' => $si['supplier']])->toArray());

        // Prompt Engineering (Sistem Perintah Utama)
        $systemInstruction = "Kamu adalah asisten ERP cerdas. Tugasmu mengubah input teks menjadi JSON.

TIPE TRANSAKSI:
1. 'INCOME': Pemasukan umum.
2. 'EXPENSE': Pengeluaran umum.
3. 'SALE': Penjualan (Order).
4. 'PURCHASE': Pembelian stok atau pengeluaran modal.

STRUKTUR JSON:
{
  'type': enum,
  'amount': integer (grand total),
  'category_name': string,
  'account_name': string,
  'contact_name': string (Customer/Supplier),
  'description': string,
  'items': [{name, qty, price}],
  'linked_purchases': [{item_name, supplier_name, qty, amount}]
}

DAFTAR MASTER DATA:
- KATEGORI: [ {$categoryList} ]
- AKUN: [ {$accountList} ]
- KONTAK: [ {$contactList} ]
- MASTER BARANG: {$itemList} (n=nama, p=harga jual)
- MASTER MODAL: {$supplierItemList} (n=nama, p=harga beli, s=supplier)

ATURAN HARGA JUAL (items):
- Jika user tidak menyebut harga jual secara eksplisit, cari harga dasar ('p') di MASTER BARANG.
- Jika teks menyebutkan dimensi ukuran (misal: '5x2' atau '3x4'), hitung luasnya (contoh 5 * 2 = 10). Gunakan luas ini sebagai 'qty', lalu kalikan dengan 'p' dari MASTER BARANG sebagai 'price' per unit.

ATURAN DETEKSI MODAL (linked_purchases):
- Jika user menyebutkan 'modal' atau 'beli dari [Supplier]', masukkan ke 'linked_purchases'.
- Cari harga modal di MASTER MODAL. Jika item cocok dengan 'n' di MASTER MODAL, gunakan 'p' dari sana.
- Jika user tidak menyebutkan harga modal secara eksplisit, HITUNG OTOMATIS berdasarkan 'p' di MASTER MODAL.
- PENTING: 'qty' pada 'linked_purchases' HARUS disamakan dengan 'qty' pada 'items' yang terjual. 'amount' adalah hasil dari ('qty' * 'p').
- 'linked_purchases' ini hanya diisi jika ada transaksi pengeluaran modal yang spesifik untuk Order ini.

CONTOH: 'Jual mmt 120rb ke Budi, modal cetak dari Made'
HASIL: linked_purchases = [{item_name: 'cetak mmt', supplier_name: 'Made', amount: (ambil harga dari master modal)}]

Hasilkan JSON MURNI.";

        // Data payload yang dikirim ke Google
        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $text]
                    ]
                ]
            ],
            'system_instruction' => [
                'parts' => [
                    ['text' => $systemInstruction]
                ]
            ],
            'generation_config' => [
                'response_mime_type' => 'application/json',
            ]
        ];

        // Kita coba sampai 3 kali jika server sibuk (503/429)
        $maxRetries = 3;
        $retryCount = 0;

        while ($retryCount < $maxRetries) {
            try {
                $response = Http::timeout(60)->withHeaders([
                    'Content-Type' => 'application/json',
                ])->post($endpoint, $payload); 

                if ($response->successful()) {
                    $data = $response->json();
                    
                    if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                        $jsonString = $data['candidates'][0]['content']['parts'][0]['text'];
                        return json_decode($jsonString, true);
                    }
                }

                // Jika error 503 (Busy) atau 429 (Rate Limit), tunggu sebentar lalu coba lagi
                if ($response->status() == 503 || $response->status() == 429) {
                    $retryCount++;
                    if ($retryCount < $maxRetries) {
                        sleep(1); 
                        continue;
                    }
                }

                Log::error('Gemini API Error: ' . $response->body());
                return null;

            } catch (\Exception $e) {
                $retryCount++;
                if ($retryCount < $maxRetries) {
                    sleep(1);
                    continue;
                }
                Log::error('Gemini Service Exception: ' . $e->getMessage());
                return null;
            }
        }

        return null;
    }
}
