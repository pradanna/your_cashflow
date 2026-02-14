// c:\PROJECT\WEBSITE\your_cashflow\resources\js\Pages\Orders\Show.jsx

import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Printer,
    Download,
    User,
    Calendar,
    FileText,
    TrendingUp,
} from "lucide-react";

export default function OrderShow({ order }) {
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number);
    };

    // Hitung Modal & Profit
    const totalModal =
        order.purchases?.reduce(
            (sum, p) => sum + parseFloat(p.grand_total),
            0,
        ) || 0;
    const profit = parseFloat(order.grand_total) - totalModal;

    return (
        <AuthenticatedLayout>
            <Head title={`Order #${order.invoice_number}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button & Actions */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route("orders.index")}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Kembali ke Daftar</span>
                    </Link>
                    <div className="flex gap-2">
                        <a
                            href={route("transactions.print_invoice", order.id)}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                        >
                            <Printer size={16} />
                            <span>Cetak</span>
                        </a>
                    </div>
                </div>

                {/* Invoice Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Invoice */}
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    INVOICE
                                </h1>
                                <span
                                    className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                                        order.status === "PAID"
                                            ? "bg-green-100 text-green-700 border-green-200"
                                            : order.status === "PARTIAL"
                                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                              : "bg-red-100 text-red-700 border-red-200"
                                    }`}
                                >
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">
                                #{order.invoice_number}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">
                                Tanggal Transaksi
                            </p>
                            <div className="flex items-center justify-end gap-2 text-gray-900 font-medium">
                                <Calendar size={16} className="text-gray-400" />
                                {new Date(
                                    order.transaction_date,
                                ).toLocaleDateString("id-ID", {
                                    dateStyle: "long",
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Info Pelanggan */}
                    <div className="p-8 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Ditagihkan Kepada
                            </h3>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg border border-gray-200">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">
                                        {order.contact?.name ||
                                            "Pelanggan Umum"}
                                    </p>
                                    {order.contact?.phone && (
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {order.contact.phone}
                                        </p>
                                    )}
                                    {order.contact?.address && (
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {order.contact.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {order.note && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                    Catatan
                                </h3>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                                        <FileText
                                            size={20}
                                            className="text-gray-400"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 italic leading-relaxed">
                                        "{order.note}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="p-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                            Rincian Item
                        </h3>
                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3">
                                            Deskripsi Item
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Qty
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Harga Satuan
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">
                                                    {item.item_name}
                                                </p>
                                                {item.stock && (
                                                    <span className="text-xs text-gray-400">
                                                        Stok: {item.stock.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {parseFloat(item.qty)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {formatRupiah(item.price)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                {formatRupiah(item.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold text-gray-900">
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-4 py-4 text-right"
                                        >
                                            Grand Total
                                        </td>
                                        <td className="px-4 py-4 text-right text-lg text-red-600">
                                            {formatRupiah(order.grand_total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Section Modal & Profit (Analisa) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold">
                            <TrendingUp size={20} className="text-blue-600" />
                            <h3>Analisa Profitabilitas</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                                <span className="text-gray-600 text-sm">
                                    Total Penjualan (Omzet)
                                </span>
                                <span className="font-bold text-green-700">
                                    {formatRupiah(order.grand_total)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                <span className="text-gray-600 text-sm">
                                    Total Modal (HPP/Expense)
                                </span>
                                <span className="font-bold text-red-700">
                                    {formatRupiah(totalModal)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <span className="text-gray-600 text-sm">
                                    Profit Bersih (Estimasi)
                                </span>
                                <span className="font-bold text-blue-700 text-lg">
                                    {formatRupiah(profit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-800 mb-4">
                            Rincian Pengeluaran (Modal)
                        </h3>
                        {order.purchases && order.purchases.length > 0 ? (
                            <ul className="space-y-3">
                                {order.purchases.map((purchase) => (
                                    <li
                                        key={purchase.id}
                                        className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-700">
                                                {purchase.reference_number ||
                                                    "Tanpa Nota"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(
                                                    purchase.transaction_date,
                                                ).toLocaleDateString("id-ID")}
                                            </p>
                                        </div>
                                        <span className="font-medium text-red-600">
                                            {formatRupiah(purchase.grand_total)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">
                                Belum ada data pengeluaran/modal yang diinput
                                untuk order ini.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
