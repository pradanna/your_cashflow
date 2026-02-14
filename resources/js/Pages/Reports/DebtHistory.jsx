import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { formatRupiah } from "@/Utils/format";
import { Calendar, Filter } from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";

export default function DebtHistory({ auth, debts, filters }) {
    const [dateStart, setDateStart] = useState(filters.startDate);
    const [dateEnd, setDateEnd] = useState(filters.endDate);
    const [status, setStatus] = useState(filters.status);
    const [type, setType] = useState(filters.type);

    const handleFilter = () => {
        router.get(
            route("reports.debts"),
            { date_start: dateStart, date_end: dateEnd, status, type },
            { preserveState: true, preserveScroll: true },
        );
    };

    const getStatusBadge = (s) => {
        const map = {
            UNPAID: "bg-red-100 text-red-800",
            PARTIAL: "bg-yellow-100 text-yellow-800",
            PAID: "bg-green-100 text-green-800",
        };
        return (
            <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${map[s]}`}
            >
                {s}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Laporan Riwayat Hutang Piutang
                </h2>
            }
        >
            <Head title="Riwayat Hutang Piutang" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Filter Section */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                            <Calendar size={18} className="text-gray-500" />
                            <input
                                type="date"
                                className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700"
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700"
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                            />
                        </div>

                        <select
                            className="border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="ALL">Semua Tipe</option>
                            <option value="PAYABLE">Hutang (Payable)</option>
                            <option value="RECEIVABLE">
                                Piutang (Receivable)
                            </option>
                        </select>

                        <select
                            className="border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="UNPAID">Belum Lunas</option>
                            <option value="PARTIAL">Cicilan</option>
                            <option value="PAID">Lunas</option>
                        </select>

                        <PrimaryButton
                            onClick={handleFilter}
                            className="h-[38px] gap-2"
                        >
                            <Filter size={16} /> Filter
                        </PrimaryButton>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Kontak</th>
                                    <th className="px-6 py-4">Tipe</th>
                                    <th className="px-6 py-4">Referensi</th>
                                    <th className="px-6 py-4 text-right">
                                        Total Awal
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Sisa Tagihan
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {debts.length > 0 ? (
                                    debts.map((debt) => (
                                        <tr
                                            key={debt.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                                                {new Date(
                                                    debt.created_at,
                                                ).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="px-6 py-3 font-medium text-gray-900">
                                                {debt.contact?.name || "Umum"}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span
                                                    className={`text-xs font-bold px-2 py-1 rounded ${
                                                        debt.type === "PAYABLE"
                                                            ? "text-red-600 bg-red-50"
                                                            : "text-blue-600 bg-blue-50"
                                                    }`}
                                                >
                                                    {debt.type === "PAYABLE"
                                                        ? "HUTANG"
                                                        : "PIUTANG"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-500 text-xs">
                                                {debt.order
                                                    ? `Order: ${debt.order.invoice_number}`
                                                    : debt.purchase
                                                      ? `Beli: ${debt.purchase.reference_number}`
                                                      : "Manual"}
                                            </td>
                                            <td className="px-6 py-3 text-right font-medium text-gray-700">
                                                {formatRupiah(debt.amount)}
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-red-600">
                                                {formatRupiah(debt.remaining)}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {getStatusBadge(debt.status)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-8 text-center text-gray-400"
                                        >
                                            Tidak ada data ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
