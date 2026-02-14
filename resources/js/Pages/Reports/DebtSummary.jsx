// c:\PROJECT\WEBSITE\your_cashflow\resources\js\Pages\Reports\DebtSummary.jsx

import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { formatRupiah } from "@/Utils/format";
import {
    Search,
    ArrowUpDown,
    TrendingUp,
    TrendingDown,
    Scale,
    Eye,
    X,
} from "lucide-react";
import TextInput from "@/Components/TextInput";

export default function DebtSummary({ auth, payables, receivables, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [selectedContact, setSelectedContact] = useState(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState({
        key: "total_remaining",
        direction: "desc",
    });

    // Handle Search (Debounce)
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);

        // Simple debounce
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            router.get(
                route("reports.debt-summary"),
                { search: value },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);
    };

    // Sorting Logic
    const sortData = (data) => {
        return [...data].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle string comparison for names
            if (typeof aValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            // Numeric comparison
            if (parseFloat(aValue) && parseFloat(bValue)) {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    // Processed Data
    const sortedPayables = useMemo(
        () => sortData(payables),
        [payables, sortConfig],
    );
    const sortedReceivables = useMemo(
        () => sortData(receivables),
        [receivables, sortConfig],
    );

    // Totals for Neraca
    const totalPayable = payables.reduce(
        (sum, item) => sum + parseFloat(item.total_remaining),
        0,
    );
    const totalReceivable = receivables.reduce(
        (sum, item) => sum + parseFloat(item.total_remaining),
        0,
    );
    const netBalance = totalReceivable - totalPayable;

    const TableHeader = ({ label, sortKey, align = "left" }) => (
        <th
            className={`px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${align === "right" ? "text-right" : "text-left"}`}
            onClick={() => handleSort(sortKey)}
        >
            <div
                className={`flex items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}
            >
                {label}
                <ArrowUpDown size={14} className="text-gray-400" />
            </div>
        </th>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Ringkasan Hutang & Piutang
                </h2>
            }
        >
            <Head title="Ringkasan Hutang Piutang" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Filter Section */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="relative w-full max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <TextInput
                                type="text"
                                className="pl-10 w-full"
                                placeholder="Cari nama customer atau supplier..."
                                value={search}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* TABEL PIUTANG (RECEIVABLES) */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b border-gray-100 bg-blue-50 flex justify-between items-center">
                                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                    <TrendingUp size={20} />
                                    Piutang (Receivables)
                                </h3>
                                <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                    Aset Anda
                                </span>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                        <tr>
                                            <TableHeader
                                                label="Nama Customer"
                                                sortKey="contact_name"
                                            />
                                            <TableHeader
                                                label="Jml Transaksi"
                                                sortKey="transaction_count"
                                                align="center"
                                            />
                                            <TableHeader
                                                label="Total Piutang"
                                                sortKey="total_remaining"
                                                align="right"
                                            />
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sortedReceivables.length > 0 ? (
                                            sortedReceivables.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-6 py-3 font-medium text-gray-900">
                                                            {item.contact_name}
                                                        </td>
                                                        <td className="px-6 py-3 text-center text-gray-500">
                                                            {
                                                                item.transaction_count
                                                            }
                                                        </td>
                                                        <td className="px-6 py-3 text-right font-bold text-blue-600">
                                                            {formatRupiah(
                                                                item.total_remaining,
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedContact(
                                                                        item,
                                                                    )
                                                                }
                                                                className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                                                                title="Lihat Detail"
                                                            >
                                                                <Eye
                                                                    size={18}
                                                                />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="px-6 py-8 text-center text-gray-400"
                                                >
                                                    Tidak ada data piutang.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-gray-600 font-medium">
                                    Total Piutang
                                </span>
                                <span className="text-lg font-bold text-blue-700">
                                    {formatRupiah(totalReceivable)}
                                </span>
                            </div>
                        </div>

                        {/* TABEL HUTANG (PAYABLES) */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
                                <h3 className="font-bold text-red-800 flex items-center gap-2">
                                    <TrendingDown size={20} />
                                    Hutang (Payables)
                                </h3>
                                <span className="text-xs font-semibold bg-red-200 text-red-800 px-2 py-1 rounded-full">
                                    Kewajiban Anda
                                </span>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                        <tr>
                                            <TableHeader
                                                label="Nama Supplier"
                                                sortKey="contact_name"
                                            />
                                            <TableHeader
                                                label="Jml Transaksi"
                                                sortKey="transaction_count"
                                                align="center"
                                            />
                                            <TableHeader
                                                label="Total Hutang"
                                                sortKey="total_remaining"
                                                align="right"
                                            />
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sortedPayables.length > 0 ? (
                                            sortedPayables.map((item, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-6 py-3 font-medium text-gray-900">
                                                        {item.contact_name}
                                                    </td>
                                                    <td className="px-6 py-3 text-center text-gray-500">
                                                        {item.transaction_count}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-bold text-red-600">
                                                        {formatRupiah(
                                                            item.total_remaining,
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button
                                                            onClick={() =>
                                                                setSelectedContact(
                                                                    item,
                                                                )
                                                            }
                                                            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="px-6 py-8 text-center text-gray-400"
                                                >
                                                    Tidak ada data hutang.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-gray-600 font-medium">
                                    Total Hutang
                                </span>
                                <span className="text-lg font-bold text-red-700">
                                    {formatRupiah(totalPayable)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* NERACA SUMMARY */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Scale size={24} className="text-gray-600" />
                            Neraca Hutang Piutang
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                                <p className="text-sm text-blue-600 font-medium mb-1">
                                    Total Piutang (Aset)
                                </p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {formatRupiah(totalReceivable)}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                                <p className="text-sm text-red-600 font-medium mb-1">
                                    Total Hutang (Kewajiban)
                                </p>
                                <p className="text-2xl font-bold text-red-700">
                                    {formatRupiah(totalPayable)}
                                </p>
                            </div>
                            <div
                                className={`p-4 rounded-lg border ${netBalance >= 0 ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}
                            >
                                <p
                                    className={`text-sm font-medium mb-1 ${netBalance >= 0 ? "text-green-600" : "text-orange-600"}`}
                                >
                                    Selisih (Net)
                                </p>
                                <p
                                    className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-700" : "text-orange-700"}`}
                                >
                                    {netBalance >= 0 ? "+" : ""}{" "}
                                    {formatRupiah(netBalance)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL DETAIL */}
                {selectedContact && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
                            <div
                                className={`p-4 border-b flex justify-between items-center ${selectedContact.type === "RECEIVABLE" ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"}`}
                            >
                                <h3
                                    className={`font-bold text-lg ${selectedContact.type === "RECEIVABLE" ? "text-blue-800" : "text-red-800"}`}
                                >
                                    Detail{" "}
                                    {selectedContact.type === "RECEIVABLE"
                                        ? "Piutang"
                                        : "Hutang"}{" "}
                                    - {selectedContact.contact_name}
                                </h3>
                                <button
                                    onClick={() => setSelectedContact(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-0 overflow-y-auto flex-1 bg-gray-50">
                                {selectedContact.details.map((debt, idx) => (
                                    <div
                                        key={debt.id}
                                        className="bg-white p-4 border-b border-gray-100 last:border-0"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">
                                                    {debt.order
                                                        ?.invoice_number ||
                                                        debt.purchase
                                                            ?.reference_number ||
                                                        "No Ref"}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(
                                                        debt.created_at,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        { dateStyle: "medium" },
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className={`font-bold text-sm ${selectedContact.type === "RECEIVABLE" ? "text-blue-600" : "text-red-600"}`}
                                                >
                                                    {formatRupiah(
                                                        debt.remaining,
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    dari{" "}
                                                    {formatRupiah(debt.amount)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2">
                                            <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                                                Item Details
                                            </p>
                                            {(
                                                debt.order?.items ||
                                                debt.purchase?.items ||
                                                []
                                            ).length > 0 ? (
                                                (
                                                    debt.order?.items ||
                                                    debt.purchase?.items
                                                ).map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex justify-between items-center text-gray-700"
                                                    >
                                                        <span className="flex-1 truncate pr-2">
                                                            {item.item_name}{" "}
                                                            <span className="text-gray-400">
                                                                x{item.qty}
                                                            </span>
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatRupiah(
                                                                item.subtotal,
                                                            )}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-400 italic">
                                                    Tidak ada detail item
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t bg-white flex justify-end">
                                <button
                                    onClick={() => setSelectedContact(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
