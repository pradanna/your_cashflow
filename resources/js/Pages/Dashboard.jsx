import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatRupiah } from "@/Utils/format";
import { Head, Link } from "@inertiajs/react";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Package,
    Landmark,
    Scale,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingCart,
    Box,
    UserCheck,
} from "lucide-react";
import MagicInput from "@/Components/UI/MagicInput";

export default function Dashboard({
    auth,
    stats,
    accounts,
    payables,
    receivables,
    stocks,
}) {
    const isKaryawan = auth.user.role === "karyawan";

    if (isKaryawan) {
        return (
            <AuthenticatedLayout
                header={
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Karyawan Dashboard
                            </h2>
                            <p className="text-xs font-normal text-gray-500 mt-0.5">
                                Akses cepat ke input orderan dan pemantauan stok barang.
                            </p>
                        </div>
                    </div>
                }
            >
                <Head title="Karyawan Dashboard" />



                {/* --- QUICK ACTION SHORCUTS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Link
                        href="/orders"
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 group"
                    >
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-base">
                                Input Order Baru
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Catat penjualan baru
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/stocks"
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 group"
                    >
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <Box size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-base">
                                Kelola Stok Barang
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Lihat & sesuaikan data stok barang
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/catalogs"
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 group"
                    >
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <Package size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-base">
                                Katalog Produk
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Cek harga barang & unit penjualan
                            </p>
                        </div>
                    </Link>
                </div>

                {/* --- MONITORING INFO --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Stock List */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <Box className="text-red-500" size={20} />
                            Stok Toko Saat Ini (Top Aset)
                        </h4>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                            {stocks && stocks.length > 0 ? (
                                stocks.map((stock) => (
                                    <div
                                        key={stock.id}
                                        className="p-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {stock.name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Unit: {stock.unit} | Harga: {formatRupiah(stock.selling_price)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${Number(stock.qty) < 10 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {Number(stock.qty).toLocaleString("id-ID")} {stock.unit}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    Belum ada data stok barang.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <AlertCircle className="text-amber-500" size={20} />
                            Peringatan Stok Menipis
                        </h4>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                            {stocks && stocks.filter(s => Number(s.qty) < 10).length > 0 ? (
                                stocks.filter(s => Number(s.qty) < 10).map((stock) => (
                                    <div
                                        key={stock.id}
                                        className="p-4 flex justify-between items-center bg-amber-50/10 hover:bg-amber-50/20 transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {stock.name}
                                            </p>
                                            <p className="text-xs text-red-500 mt-0.5 font-medium">
                                                Segera restok! Stok di bawah batas minimal (10).
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                            Sisa {Number(stock.qty).toLocaleString("id-ID")} {stock.unit}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                                    <UserCheck className="text-emerald-500" size={24} />
                                    <p className="font-medium text-gray-600">Semua Stok Aman</p>
                                    <p className="text-xs">Tidak ada barang dengan stok kritis saat ini.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout header="Dashboard Overview">
            <Head title="Dashboard" />

            <MagicInput />

            {/* --- BAGIAN 1: STATS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1: Liquid Assets */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={80} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Liquid Assets
                        </p>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {formatRupiah(stats.liquid_assets)}
                        </h3>
                        <p className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1">
                            <Landmark size={14} /> Total Saldo Semua Akun
                        </p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full w-3/4"></div>
                    </div>
                </div>

                {/* Card 2: Posisi Kas Bersih */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Scale
                            size={80}
                            className={
                                stats.net_cash_position >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                            }
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Posisi Kas Bersih
                        </p>
                        <h3
                            className={`text-2xl font-bold ${stats.net_cash_position >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                            {formatRupiah(stats.net_cash_position)}
                        </h3>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            (Akun + Piutang) - Hutang
                        </p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div
                            className={`h-full rounded-full w-1/2 ${stats.net_cash_position >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                        ></div>
                    </div>
                </div>

                {/* Card 3: Kekayaan Global */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={80} className="text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Kekayaan Global
                        </p>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {formatRupiah(stats.global_wealth)}
                        </h3>
                        <p className="text-xs text-purple-600 mt-2 font-medium flex items-center gap-1">
                            <Package size={14} /> Real + Estimasi + Stock
                        </p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full w-full"></div>
                    </div>
                </div>
            </div>

            {/* --- BAGIAN 2: RINCIAN DETAIL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* KOLOM 1: SALDO AKUN */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <Wallet className="text-blue-500" size={20} />
                            Saldo Akun
                        </h4>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">
                            {accounts.length} Akun
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {accounts.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {accounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {account.name
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {account.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">
                                            {formatRupiah(account.balance)}
                                        </span>
                                    </div>
                                ))}
                                <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase">
                                        Total Liquid
                                    </span>
                                    <span className="text-sm font-bold text-blue-600">
                                        {formatRupiah(stats.liquid_assets)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Belum ada akun
                            </div>
                        )}
                    </div>
                </div>

                {/* KOLOM 2: KEWAJIBAN (HUTANG) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <TrendingDown className="text-red-500" size={20} />
                            Kewajiban
                        </h4>
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium">
                            {payables.length} Aktif
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {payables.length > 0 ? (
                            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto scrollbar-thin">
                                {payables.map((debt) => (
                                    <div
                                        key={debt.id}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-medium text-gray-700">
                                                {debt.contact?.name ||
                                                    "Unknown"}
                                            </span>
                                            <span className="text-sm font-bold text-red-600">
                                                {formatRupiah(debt.remaining)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <span>
                                                Jatuh Tempo:{" "}
                                                {debt.due_date || "-"}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold">
                                                {debt.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                                <AlertCircle
                                    size={24}
                                    className="text-gray-300"
                                />
                                Tidak ada hutang aktif
                            </div>
                        )}
                        <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase">
                                Total Kewajiban
                            </span>
                            <span className="text-sm font-bold text-red-600">
                                {formatRupiah(stats.total_payable)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* KOLOM 3: ASET POTENSIAL (PIUTANG + STOK) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <TrendingUp
                                className="text-emerald-500"
                                size={20}
                            />
                            Aset Potensial
                        </h4>
                    </div>

                    {/* 1. Stok Barang Summary */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">
                                    Nilai Stok Barang
                                </p>
                                <p className="text-sm font-bold text-gray-800">
                                    {formatRupiah(stats.total_stock_value)}
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight size={16} className="text-gray-300" />
                    </div>

                    {/* 2. Stock List (Top Value) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                            <h5 className="text-xs font-bold text-gray-500 uppercase">
                                Top Aset Stok
                            </h5>
                        </div>
                        {stocks && stocks.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {stocks.map((stock) => (
                                    <div
                                        key={stock.id}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-medium text-gray-700">
                                                {stock.name}
                                            </span>
                                            <span className="text-sm font-bold text-purple-600">
                                                {formatRupiah(
                                                    stock.qty *
                                                    stock.selling_price,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <span>
                                                Stok:{" "}
                                                {Number(
                                                    stock.qty,
                                                ).toLocaleString("id-ID")}{" "}
                                                {stock.unit}
                                            </span>
                                            <span>
                                                HPP:{" "}
                                                {formatRupiah(
                                                    stock.selling_price,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                Tidak ada data stok
                            </div>
                        )}
                    </div>

                    {/* 3. Piutang List */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                            <h5 className="text-xs font-bold text-gray-500 uppercase">
                                Piutang Aktif & Estimasi
                            </h5>
                        </div>

                        {receivables.length > 0 ? (
                            <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto scrollbar-thin">
                                {receivables.map((debt) => (
                                    <div
                                        key={debt.id}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-medium text-gray-700">
                                                {debt.contact?.name ||
                                                    "Unknown"}
                                            </span>
                                            <span className="text-sm font-bold text-emerald-600">
                                                {formatRupiah(debt.remaining)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <span>
                                                Invoice: #{debt.order_id || "-"}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[10px] font-bold">
                                                {debt.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                Tidak ada piutang aktif
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase">
                                Total Piutang
                            </span>
                            <span className="text-sm font-bold text-emerald-600">
                                {formatRupiah(stats.total_receivable)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
