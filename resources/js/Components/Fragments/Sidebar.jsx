import React from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Wallet,
    Users,
    Package,
    Box,
    Tags,
    ShoppingCart,
    ShoppingBag,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Banknote,
    PieChart,
    FileText,
    ClipboardList,
    ArrowRightLeft,
} from "lucide-react";

export default function Sidebar() {
    const { url } = usePage();

    // Fungsi helper untuk mengecek apakah menu sedang aktif
    const isActive = (path) => {
        if (path === "/dashboard" && url === "/dashboard") return true;
        // Logic startsWith agar sub-halaman tetap mengaktifkan menu induk
        return path !== "/dashboard" && url.startsWith(path);
    };

    const menuGroups = [
        {
            title: "UTAMA",
            items: [
                {
                    label: "Dashboard",
                    href: "/dashboard",
                    icon: LayoutDashboard,
                },
            ],
        },
        {
            title: "MASTER DATA",
            items: [
                { label: "Manajemen Akun", href: "/accounts", icon: Wallet },
                { label: "Data Kontak", href: "/contacts", icon: Users },
                { label: "Katalog Produk", href: "/catalogs", icon: Package }, // Master Item Jual
                { label: "Stok Barang", href: "/stocks", icon: Box }, // Master Inventory (Tambahan)
                { label: "Kategori", href: "/categories", icon: Tags },
            ],
        },
        {
            title: "TRANSAKSI",
            items: [
                {
                    label: "Penjualan (Order)",
                    href: "/orders",
                    icon: ShoppingCart,
                },
                {
                    label: "Pembelian (Purchase)",
                    href: "/purchases",
                    icon: ShoppingBag,
                },
                {
                    label: "Pemasukan (Income)",
                    href: "/transactions/income",
                    icon: TrendingUp,
                },
                {
                    label: "Pengeluaran (Outcome)",
                    href: "/transactions/expense",
                    icon: TrendingDown,
                },
                { label: "Hutang & Piutang", href: "/debts", icon: CreditCard },
            ],
        },
        {
            title: "LAPORAN",
            items: [
                {
                    label: "Arus Kas Harian",
                    href: "/reports/daily-cashflow",
                    icon: Banknote,
                },
                {
                    label: "Laba Rugi",
                    href: "/reports/profit-loss",
                    icon: PieChart,
                }, // Income & Outcome Summary
                {
                    label: "Riwayat Hutang",
                    href: "/reports/debts",
                    icon: FileText,
                },
                {
                    label: "Ringkasan Hutang & Piutang",
                    href: "/reports/debt-summary",
                    icon: FileText,
                },
                {
                    label: "Statement",
                    href: "/reports/statements",
                    icon: ClipboardList,
                }, // Laporan Stok (Tambahan)
            ],
        },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50">
            {/* Header / Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-red-600 font-bold text-xl"
                >
                    <div className="p-1.5 bg-red-100 rounded-lg">
                        <ArrowRightLeft className="w-6 h-6 text-red-600" />
                    </div>
                    <span>Cashflow</span>
                </Link>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
                {menuGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item, itemIndex) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={itemIndex}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                                            active
                                                ? "bg-red-600 text-white hover:bg-red-700 hover:text-white group-hover:bg-red-600 shadow-sm"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    >
                                        <Icon
                                            size={20}
                                            className={`transition-colors ${
                                                active
                                                    ? "text-white"
                                                    : "text-gray-400 group-hover:text-gray-600"
                                            }`}
                                        />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="text-xs text-center text-gray-400">
                    &copy; 2026 Your Cashflow
                </div>
            </div>
        </aside>
    );
}
