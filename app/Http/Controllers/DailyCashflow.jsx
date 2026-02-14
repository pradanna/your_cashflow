import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { formatRupiah } from "@/Utils/format";
import { Calendar, Filter, Download } from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";

export default function DailyCashflow({
    auth,
    reportData,
    filters,
    openingBalance,
    closingBalance,
}) {
    const [dateStart, setDateStart] = useState(filters.startDate);
    const [dateEnd, setDateEnd] = useState(filters.endDate);

    const handleFilter = () => {
        router.get(
            route("reports.daily-cashflow"),
            {
                date_start: dateStart,
                date_end: dateEnd,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Hitung total untuk footer tabel
    const totalIncome = reportData.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = reportData.reduce(
        (sum, item) => sum + item.expense,
        0,
    );
    const totalReceivable = reportData.reduce(
        (sum, item) => sum + item.receivable,
        0,
    );
    const totalPayable = reportData.reduce(
        (sum, item) => sum + item.payable,
        0,
    );

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Laporan Arus Kas Harian
                </h2>
            }
        >
            <Head title="Laporan Cashflow" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Filter Section */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                                <Calendar size={18} className="text-gray-500" />
                                <input
                                    type="date"
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700"
                                    value={dateStart}
                                    onChange={(e) =>
                                        setDateStart(e.target.value)
                                    }
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                />
                            </div>
                            <PrimaryButton
                                onClick={handleFilter}
                                className="h-10 gap-2"
                            >
                                <Filter size={16} /> Terapkan
                            </PrimaryButton>
                        </div>

                        <div className="flex gap-4 text-sm">
                            <div className="text-right">
                                <p className="text-gray-500">Saldo Awal</p>
                                <p className="font-bold text-gray-800">
                                    {formatRupiah(openingBalance)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500">Saldo Akhir</p>
                                <p
                                    className={`font-bold ${closingBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                    {formatRupiah(closingBalance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 min-w-[150px]">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-4 text-right text-green-700 bg-green-50/50">
                                            Pemasukan
                                        </th>
                                        <th className="px-6 py-4 text-right text-red-700 bg-red-50/50">
                                            Pengeluaran
                                        </th>
                                        <th className="px-6 py-4 text-right font-bold">
                                            Arus Kas Bersih
                                        </th>
                                        <th className="px-6 py-4 text-right text-gray-500 border-l">
                                            Piutang (Baru)
                                        </th>
                                        <th className="px-6 py-4 text-right text-gray-500">
                                            Hutang (Baru)
                                        </th>
                                        <th className="px-6 py-4 text-right font-bold bg-gray-50">
                                            Saldo Akhir
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reportData.map((row, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-700">
                                                {formatDate(row.dateStr)}
                                            </td>
                                            <td className="px-6 py-3 text-right text-green-600 bg-green-50/30">
                                                {row.income > 0
                                                    ? formatRupiah(row.income)
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-3 text-right text-red-600 bg-red-50/30">
                                                {row.expense > 0
                                                    ? formatRupiah(row.expense)
                                                    : "-"}
                                            </td>
                                            <td
                                                className={`px-6 py-3 text-right font-medium ${row.netCash >= 0 ? "text-green-600" : "text-red-600"}`}
                                            >
                                                {row.netCash !== 0
                                                    ? (row.netCash > 0
                                                          ? "+"
                                                          : "") +
                                                      formatRupiah(row.netCash)
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-600 border-l border-gray-100">
                                                {row.receivable > 0
                                                    ? formatRupiah(
                                                          row.receivable,
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-600">
                                                {row.payable > 0
                                                    ? formatRupiah(row.payable)
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-gray-800 bg-gray-50/50">
                                                {formatRupiah(
                                                    row.currentBalance,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100 font-bold border-t border-gray-200">
                                    <tr>
                                        <td className="px-6 py-4">TOTAL</td>
                                        <td className="px-6 py-4 text-right text-green-700">
                                            {formatRupiah(totalIncome)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-red-700">
                                            {formatRupiah(totalExpense)}
                                        </td>
                                        <td
                                            className={`px-6 py-4 text-right ${totalIncome - totalExpense >= 0 ? "text-green-700" : "text-red-700"}`}
                                        >
                                            {formatRupiah(
                                                totalIncome - totalExpense,
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-700 border-l border-gray-200">
                                            {formatRupiah(totalReceivable)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-700">
                                            {formatRupiah(totalPayable)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-900">
                                            {formatRupiah(closingBalance)}
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
