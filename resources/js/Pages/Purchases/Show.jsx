import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Printer,
    User,
    Calendar,
    FileText,
    ShoppingBag,
} from "lucide-react";

export default function PurchaseShow({ auth, purchase }) {
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Purchase #${purchase.reference_number}`} />

            <div className="max-w-4xl mx-auto space-y-6 py-6">
                {/* Back Button & Actions */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route("purchases.index")}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Kembali ke Daftar</span>
                    </Link>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                            <Printer size={16} />
                            <span>Cetak</span>
                        </button>
                    </div>
                </div>

                {/* Invoice/Nota Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Nota */}
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <ShoppingBag size={24} />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    NOTA PEMBELIAN
                                </h1>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-gray-500 text-sm">
                                    #{purchase.reference_number}
                                </span>
                                <span
                                    className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                                        purchase.status === "PAID"
                                            ? "bg-green-100 text-green-700 border-green-200"
                                            : purchase.status === "PARTIAL"
                                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                              : "bg-red-100 text-red-700 border-red-200"
                                    }`}
                                >
                                    {purchase.status === "UNPAID"
                                        ? "BELUM LUNAS"
                                        : purchase.status}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">
                                Tanggal Transaksi
                            </p>
                            <div className="flex items-center justify-end gap-2 text-gray-900 font-medium">
                                <Calendar size={16} className="text-gray-400" />
                                {new Date(
                                    purchase.transaction_date,
                                ).toLocaleDateString("id-ID", {
                                    dateStyle: "long",
                                })}
                            </div>
                            {purchase.debt && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">
                                        Sisa Hutang
                                    </p>
                                    <p className="text-red-600 font-bold">
                                        {formatRupiah(purchase.debt.remaining)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Supplier */}
                    <div className="p-8 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Supplier (Dibeli Dari)
                            </h3>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg border border-gray-200">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">
                                        {purchase.contact?.name ||
                                            "Supplier Umum"}
                                    </p>
                                    {purchase.contact?.phone && (
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {purchase.contact.phone}
                                        </p>
                                    )}
                                    {purchase.contact?.address && (
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {purchase.contact.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {purchase.note && (
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
                                        "{purchase.note}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="p-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                            Rincian Item Belanja
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
                                            Harga Beli
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {purchase.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">
                                                    {item.item_name}
                                                </p>
                                                {item.stock && (
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                        Masuk Stok:{" "}
                                                        {item.stock.name}
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
                                            {formatRupiah(purchase.grand_total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
