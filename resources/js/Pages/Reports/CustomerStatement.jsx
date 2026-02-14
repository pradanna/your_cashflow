import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { formatRupiah } from "@/Utils/format";
import { Calendar, Printer, Search } from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";

export default function CustomerStatement({
    auth,
    customers,
    filters,
    statement,
}) {
    const [dateStart, setDateStart] = useState(filters.startDate);
    const [dateEnd, setDateEnd] = useState(filters.endDate);
    const [contactId, setContactId] = useState(filters.contactId || "");

    const handleFilter = () => {
        router.get(
            route("reports.statements"),
            { date_start: dateStart, date_end: dateEnd, contact_id: contactId },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePrint = () => {
        const url = route("reports.statements.pdf", {
            date_start: dateStart,
            date_end: dateEnd,
            contact_id: contactId,
        });
        window.open(url, "_blank");
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight print:hidden">
                    Laporan Tagihan Pelanggan
                </h2>
            }
        >
            <Head title="Statement of Account" />

            <div className="py-6 print:p-0 print:bg-white">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Filter Section (Hidden on Print) */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end print:hidden">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-bold text-gray-500 uppercase">
                                Pilih Pelanggan
                            </label>
                            <select
                                className="w-full mt-1 border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                                value={contactId}
                                onChange={(e) => setContactId(e.target.value)}
                            >
                                <option value="">-- Pilih Customer --</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">
                                Periode Transaksi
                            </label>
                            <div className="flex items-center gap-2 mt-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                                <Calendar size={18} className="text-gray-500" />
                                <input
                                    type="date"
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700 w-32"
                                    value={dateStart}
                                    onChange={(e) =>
                                        setDateStart(e.target.value)
                                    }
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700 w-32"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                />
                            </div>
                        </div>

                        <PrimaryButton
                            onClick={handleFilter}
                            className="h-[42px] gap-2"
                        >
                            <Search size={16} /> Tampilkan
                        </PrimaryButton>

                        {statement && (
                            <button
                                onClick={handlePrint}
                                className="h-[42px] px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                                <Printer size={16} /> Cetak
                            </button>
                        )}
                    </div>

                    {/* Statement Paper */}
                    {statement ? (
                        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0">
                            {/* Kop Surat */}
                            <img
                                src="/images/local/kop-placeholder.png"
                                alt="Kop Surat"
                                className="w-full h-auto mb-6"
                            />

                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-red-600">
                                        STATEMENT OF ACCOUNT
                                    </h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Rekapitulasi Tagihan
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        {statement.contact.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        {statement.contact.address ||
                                            "Alamat tidak tersedia"}
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        {statement.contact.phone ||
                                            "No. Telp tidak tersedia"}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0">
                                <div className="text-sm text-gray-600">
                                    Periode:{" "}
                                    <span className="font-bold text-gray-900">
                                        {new Date(dateStart).toLocaleDateString(
                                            "id-ID",
                                        )}
                                    </span>{" "}
                                    s/d{" "}
                                    <span className="font-bold text-gray-900">
                                        {new Date(dateEnd).toLocaleDateString(
                                            "id-ID",
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Table */}
                            <table className="w-full text-sm text-left mb-8">
                                <thead className="bg-gray-50 text-gray-600 font-bold uppercase border-b border-gray-200 print:bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3">Tanggal</th>
                                        <th className="px-4 py-3">
                                            No. Invoice
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Total Tagihan
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Sudah Dibayar
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Sisa (Outstanding)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {statement.invoices.length > 0 ? (
                                        statement.invoices.map((inv) => (
                                            <tr key={inv.id}>
                                                <td className="px-4 py-3 text-gray-600 align-top">
                                                    {new Date(
                                                        inv.created_at,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900 align-top">
                                                    <div>
                                                        {inv.order
                                                            ? inv.order
                                                                  .invoice_number
                                                            : "Manual Debt"}
                                                    </div>
                                                    {inv.order?.items?.length >
                                                        0 && (
                                                        <div className="mt-1 space-y-1">
                                                            {inv.order.items.map(
                                                                (item, idx) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="text-xs text-gray-500"
                                                                    >
                                                                        •{" "}
                                                                        {
                                                                            item.item_name
                                                                        }{" "}
                                                                        <span className="text-gray-400">
                                                                            (
                                                                            {Number(
                                                                                item.qty,
                                                                            )}{" "}
                                                                            x{" "}
                                                                            {formatRupiah(
                                                                                item.price,
                                                                            )}
                                                                            )
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700 align-top">
                                                    {formatRupiah(inv.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-green-600 align-top">
                                                    {formatRupiah(
                                                        inv.amount -
                                                            inv.remaining,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-red-600 align-top">
                                                    {formatRupiah(
                                                        inv.remaining,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-4 py-8 text-center text-gray-400 italic"
                                            >
                                                Tidak ada tagihan pada periode
                                                ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="border-t-2 border-gray-200 font-bold text-gray-900 bg-gray-50 print:bg-gray-100">
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-4 py-4 text-right uppercase"
                                        >
                                            Total Yang Harus Dibayar
                                        </td>
                                        <td className="px-4 py-4 text-right text-lg text-red-600">
                                            {formatRupiah(
                                                statement.total_remaining,
                                            )}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Bank Details */}
                            <div className="mt-8 flex justify-end print:mt-12">
                                <div className="text-right border border-gray-200 p-4 rounded-lg bg-gray-50 print:bg-transparent print:border-gray-300 min-w-[250px]">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                                        Pembayaran Transfer ke:
                                    </p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        Bank BCA
                                    </p>
                                    <p className="font-mono text-lg text-gray-800 tracking-wide">
                                        7850663763
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        A.n Pradana Mahendra
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300 print:hidden">
                            Silakan pilih pelanggan dan periode untuk
                            menampilkan laporan.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
