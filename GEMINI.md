# GEMINI.md - Context & Guidelines for "your_cashflow"

## 1. Project Identity

- **Name:** Your Cashflow
- **Type:** Mini ERP / POS & Expense Tracker
- **Goal:** Mencatat arus kas (Order-to-Cash) yang terintegrasi dengan pengeluaran modal per nota.
- **Vibe:** Clean, Modern, Professional, Dashboard-style.

## 2. Tech Stack

- **Backend:** Laravel 12 (v12.x) - Monolith
- **Frontend Adapter:** Inertia.js
- **UI Library:** React (Functional Components + Hooks)
- **Styling:** Tailwind CSS
- **Icons:** `lucide-react`
- **State Management:** React `useState` / `useContext` (Keep it simple)

## 3. Design System & UI Rules

- **Color Palette:**
    - **Primary:** `bg-red-600` / `text-red-600` (Brand).
    - **Background:** `bg-gray-50`.
    - **Surface:** `bg-white`.
- **Components:**
    - Cards: `rounded-2xl shadow-sm border border-gray-100 p-6`.
    - Sidebar: Floating vertical stack style.
- **Layout:** `<AuthenticatedLayout>` wraps Sidebar (Left) and Main Content (Right).

## 4. Database Schema (The Blueprint)

### A. Master Data

- **`accounts`**: Penyimpanan Uang (Dompet/Rekening).
    - `id`, `user_id`, `name` (e.g., BCA, Cash), `balance` (decimal, default 0).
- **`categories`**: Pos Anggaran.
    - `id`, `user_id`, `name`, `type` (INCOME/EXPENSE).
- **`contacts`**: Relasi Bisnis.
    - `id`, `user_id`, `name`, `type` (CUSTOMER/SUPPLIER/BOTH), `phone`, `address`.
- **`stocks`**: Inventory & Master Barang.
    - `id`, `user_id`, `name`.
    - `unit` (pcs, kg, box).
    - `qty` (decimal, default 0) -> _Stok saat ini_.
    - `selling_price` (decimal, default 0) -> _Harga Modal Rata-rata (Moving Average)_.
    - `selling_price` (decimal, default 0) -> _Harga Jual Default_.

### B. Transaction Headers (Dokumen Pemicu)

- **`orders`**: Penjualan (Sales).
    - `id`, `user_id`, `contact_id` (nullable), `invoice_number`.
    - `transaction_date`, `grand_total`.
    - `status` (UNPAID/PARTIAL/PAID), `note`.
- **`order_items`**: Detail Penjualan.
    - `id`, `order_id`, `stock_id` (nullable - jika barang stok), `item_name` (custom text), `qty`, `price`, `subtotal`.
- **`purchases`**: Pembelian (Expenses).
    - `id`, `user_id`, `contact_id` (Supplier).
    - **`order_id` (Nullable)**: _Key Feature_. Jika diisi, belanja ini adalah modal khusus untuk Order tersebut.
    - `reference_number` (No. Nota Supplier), `transaction_date`, `grand_total`.
    - `status` (UNPAID/PARTIAL/PAID).
- **`purchase_items`**: Detail Pembelian.
    - `id`, `purchase_id`, `stock_id` (nullable), `item_name`, `qty`, `price`, `subtotal`.

### C. Financial Core (Arus Kas)

- **`debts`**: Pencatatan Hutang/Piutang.
    - `id`, `user_id`, `contact_id`.
    - `type` (PAYABLE/RECEIVABLE).
    - `order_id` (nullable), `purchase_id` (nullable).
    - `amount` (Awal), `remaining` (Sisa), `due_date`, `status`.
- **`transactions`**: Mutasi Uang Real (Gabungan Income/Expense).
    - `id`, `user_id`, `account_id` (Sumber/Tujuan Dana).
    - `category_id` (Pos Anggaran).
    - `type` (INCOME/EXPENSE).
    - `amount` (Nominal Real).
    - `transaction_date`, `description`.
    - **References:** `order_id` (Pelunasan Order), `purchase_id` (Pelunasan Belanja), `debt_id` (Cicilan Hutang).
- **`stock_mutations`**: History Stok.
    - `id`, `stock_id`, `type` (IN/OUT/ADJUSTMENT).
    - `qty`, `current_qty` (Snapshot), `current_selling_price` (Snapshot HPP).
    - `reference_id` (Poly: order_id / purchase_id).

## 5. Business Logic & Workflows

### A. The "Modal per Nota" Logic

Fitur untuk menghitung Net Profit per Order secara presisi.

1.  **General Expense:** Belanja umum -> `purchases.order_id` = `NULL`.
2.  **Order-Linked Expense:**
    - Saat input pengeluaran, User memilih Order ID terkait.
    - **Profit Formula:** `Order.grand_total` - `Sum(Purchases linked to Order)`.

### B. Account Balance Observer (Auto-Calculation)

Saldo di tabel `accounts` dihitung otomatis via Model Observer saat `transactions` dibuat/diupdate/dihapus.

- **Logic:**
    - `INCOME`: Menambah Balance.
    - `EXPENSE`: Mengurangi Balance.
- **Safety:** Fitur "Recalculate Balance" tersedia untuk menghitung ulang dari nol jika terjadi mismatch.

### C. Stock Valuation (Moving Average Cost)

Harga modal (`stocks.selling_price`) diupdate setiap kali ada Pembelian (Purchase) baru.

- **Formula:** `((Old Qty * Old Avg) + (New Qty * New Price)) / (Old Qty + New Qty)`
- Ini memastikan nilai aset dan HPP selalu akurat walau harga beli dari supplier naik-turun.

## 6. Coding Conventions

- **Icons:** Gunakan `<LucideIconName size={20} />`.
- **Routing:** Gunakan Resource Controller standar (e.g., `TransactionController`).
- **Frontend:** Halaman dibungkus folder `resources/js/Pages/ModuleName`.

---

## 57. Architectural Strategy (Backend)

### A. No Repository Pattern

- **Rule:** Jangan gunakan Repository Pattern. Itu over-engineering untuk project ini.
- **Read:** Gunakan Eloquent langsung di Controller (`Order::with('items')->get()`).
- **Write Simple:** Gunakan Eloquent di Controller (`Category::create(...)`).

### B. Service Pattern (Selective)

- **Rule:** Gunakan Service Pattern HANYA untuk logika bisnis yang kompleks (Transactional).
- **Use Case:**
    - **Create Order:** (Simpan Order -> Kurangi Stok -> Buat Piutang/Income).
    - **Create Purchase:** (Simpan Belanja -> Tambah Stok -> Update HPP -> Buat Hutang/Expense).
- **Location:** `app/Services/TransactionService.php`, `app/Services/InventoryService.php`.

## 6. Frontend Structure (React + Inertia)

### A. Directory Taxonomy

```text
resources/js/
├── Components/
│   ├── UI/             # Dumb Components (Card, Button, Input, Badge)
│   ├── Fragments/      # Partial Layouts (Sidebar, Navbar)
├── Layouts/            # Persistent Layouts (AuthenticatedLayout)
├── Pages/              # Smart Components (Views from Laravel)
├── Utils/              # Helpers (formatRupiah, formatDate)
└── Hooks/              # Custom Hooks (useDebounce)


**Note to AI:** Always refer to this file as the Single Source of Truth for database schema and business logic.
```
