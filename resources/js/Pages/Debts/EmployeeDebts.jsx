import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link, usePage } from "@inertiajs/react";
import { formatRupiah } from "@/Utils/format";
import {
    Search,
    Calendar,
    Wallet,
    X,
    Coins,
    User,
    ArrowRight,
    TrendingUp,
    FileText,
    History,
    ChevronRight
} from "lucide-react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

const DebtStatusBadge = ({ status }) => {
    const statusClasses = {
        UNPAID: "bg-red-50 text-red-700 border border-red-100",
        PARTIAL: "bg-amber-50 text-amber-700 border border-amber-100",
        PAID: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    };
    const statusText = {
        UNPAID: "Belum Lunas",
        PARTIAL: "Lunas Sebagian",
        PAID: "Lunas",
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-xl ${statusClasses[status]}`}>
            {statusText[status]}
        </span>
    );
};

const Pagination = ({ links }) => {
    return (
        <div className="flex flex-wrap -mb-1">
            {links.map((link, key) =>
                link.url === null ? (
                    <div
                        key={key}
                        className="mr-1 mb-1 px-3 py-2 text-xs text-gray-400 border rounded-xl"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <Link
                        key={key}
                        className={`mr-1 mb-1 px-3 py-2 text-xs border rounded-xl hover:bg-white focus:border-red-500 focus:text-red-500 ${
                            link.active ? "bg-white border-red-500 text-red-600 font-bold" : "text-gray-600 bg-gray-50 border-gray-200"
                        }`}
                        href={link.url}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </div>
    );
};

export default function EmployeeDebts({
    auth,
    debts,
    filters,
    accounts,
    categories,
}) {
    const isOwner = auth?.user?.role !== "karyawan";
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "ALL");
    const [isPaymentOpen, setPaymentOpen] = useState(false);
    const [isDetailOpen, setDetailOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);

    const paymentForm = useForm({
        account_id: "",
        category_id: "",
        amount: "",
        transaction_date: new Date().toISOString().split("T")[0],
        note: "",
    });

    useEffect(() => {
        const params = { search, status };
        const timer = setTimeout(() => {
            router.get(route("debts.employee"), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, status]);

    const openPaymentModal = (contact) => {
        setSelectedContact(contact);
        setSelectedDebt(null);
        paymentForm.setData({
            account_id: accounts[0]?.id || "",
            category_id: categories.filter(c => c.type === 'INCOME')[0]?.id || "",
            amount: contact.total_remaining,
            transaction_date: new Date().toISOString().split("T")[0],
            note: "Potong gaji bulanan",
        });
        paymentForm.clearErrors();
        setPaymentOpen(true);
    };

    const openSinglePaymentModal = (debt) => {
        setSelectedDebt(debt);
        setSelectedContact(null);
        paymentForm.setData({
            account_id: accounts[0]?.id || "",
            category_id: categories.filter(c => c.type === 'INCOME')[0]?.id || "",
            amount: debt.remaining,
            transaction_date: new Date().toISOString().split("T")[0],
            note: `Potong gaji nota ${debt.order ? debt.order.invoice_number : 'Manual'}`,
        });
        paymentForm.clearErrors();
        setPaymentOpen(true);
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        const routeName = selectedDebt ? "debts.payment" : "debts.employee_bulk_payment";
        const routeParam = selectedDebt ? selectedDebt.id : selectedContact.id;
        
        paymentForm.post(route(routeName, routeParam), {
            onSuccess: () => {
                setPaymentOpen(false);
                setDetailOpen(false);
                setSelectedDebt(null);
                setSelectedContact(null);
            },
        });
    };

    const openDetailModal = (contact) => {
        setSelectedContact(contact);
        setDetailOpen(true);
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Piutang Karyawan
                </h2>
            }
        >
            <Head title="Piutang Karyawan" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header info */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Piutang Karyawan
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Daftar piutang/bon karyawan yang nantinya akan dipotong dari gaji perbulan.
                            </p>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <Coins size={28} />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Cari nama karyawan atau no. invoice..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="w-full px-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm bg-white"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="ALL">Semua Status</option>
                                <option value="UNPAID">Belum Lunas</option>
                                <option value="PARTIAL">Cicilan</option>
                                <option value="PAID">Lunas</option>
                            </select>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    {debts.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {debts.data.map((contact) => (
                                <div
                                    key={contact.id}
                                    onClick={() => openDetailModal(contact)}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-gray-50 text-gray-600 rounded-xl">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 leading-tight">
                                                    {contact.name || "Karyawan"}
                                                </h3>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Telepon: {contact.phone || "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <DebtStatusBadge status={Number(contact.total_remaining) <= 0 ? "PAID" : "UNPAID"} />
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-400">Total Sisa Tagihan / Piutang</p>
                                        <p className="text-2xl font-extrabold text-gray-900 mt-1">
                                            {formatRupiah(contact.total_remaining || 0)}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Total Bon Awal: {formatRupiah(contact.total_amount || 0)}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <FileText size={14} className="text-gray-400" />
                                            <span className="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                                                {contact.debts ? contact.debts.length : 0} Transaksi Piutang
                                            </span>
                                        </span>
                                        <span className="text-red-600 font-semibold flex items-center gap-0.5 hover:underline">
                                            Detail & Riwayat <ChevronRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 italic">
                            Tidak ada data piutang karyawan.
                        </div>
                    )}

                    {/* Pagination */}
                    {debts.links && debts.links.length > 3 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Menampilkan {debts.data.length} dari {debts.total} data
                            </div>
                            <Pagination links={debts.links} />
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <Modal show={isDetailOpen} onClose={() => { setDetailOpen(false); }} maxWidth="2xl">
                {selectedContact && (
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                <FileText className="text-red-600" size={20} />
                                <span>Detail & Riwayat Piutang Karyawan</span>
                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    Login: {auth?.user?.name} ({auth?.user?.role})
                                </span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => { setDetailOpen(false); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Info Utama */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div>
                                <p className="text-[11px] text-gray-400 uppercase font-semibold">Nama Karyawan</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedContact.name}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 uppercase font-semibold">Status Piutang</p>
                                <div className="mt-1">
                                    <DebtStatusBadge status={Number(selectedContact.total_remaining) <= 0 ? "PAID" : "UNPAID"} />
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 uppercase font-semibold">Total Bon Awal</p>
                                <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatRupiah(selectedContact.total_amount || 0)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 uppercase font-semibold">Total Sisa Tagihan</p>
                                <p className="text-base font-extrabold text-red-600 mt-0.5">{formatRupiah(selectedContact.total_remaining || 0)}</p>
                            </div>
                        </div>

                        {/* Rincian Transaksi Piutang */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">
                                Rincian Transaksi Piutang
                            </h4>
                            <div className="border border-gray-100 rounded-xl overflow-hidden text-xs bg-white divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                {selectedContact.debts && selectedContact.debts.length > 0 ? (
                                    selectedContact.debts.map((debt, idx) => (
                                        <div key={idx} className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px]">
                                                        {debt.order ? debt.order.invoice_number : "Input Manual"}
                                                    </span>
                                                    <span className="text-gray-400 text-[10px]">{formatDate(debt.created_at)}</span>
                                                </div>
                                                {debt.note && <p className="text-gray-500 italic text-[11px]">{debt.note}</p>}
                                                <div className="text-[11px] text-gray-500">
                                                    Jumlah Awal: {formatRupiah(debt.amount)} | Sisa: <span className="font-semibold text-red-600">{formatRupiah(debt.remaining)}</span>
                                                </div>
                                                {debt.order && debt.order.items && debt.order.items.length > 0 && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Item Dipesan:</p>
                                                        <ul className="divide-y divide-gray-100/50">
                                                            {debt.order.items.map((item, itemIdx) => (
                                                                <li key={itemIdx} className="flex justify-between items-center text-[11px] py-1 text-gray-600">
                                                                    <span>
                                                                        {item.item_name} <span className="text-gray-400 font-normal">({parseFloat(item.qty)}x)</span>
                                                                    </span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {formatRupiah(item.subtotal || (item.price * item.qty))}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col md:items-end gap-2 self-end md:self-start md:pt-1">
                                                <DebtStatusBadge status={debt.status} />
                                                {isOwner && debt.status !== 'PAID' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openSinglePaymentModal(debt)}
                                                        className="px-2 py-1 text-[10px] font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                                    >
                                                        Bayar Nota
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-gray-400 italic">Belum ada rincian piutang.</p>
                                )}
                            </div>
                        </div>

                        {/* Riwayat Pembayaran / Potong Gaji */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <History size={14} />
                                <span>Riwayat Pembayaran / Potong Gaji</span>
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {(() => {
                                    const allTransactions = selectedContact.debts?.flatMap(d => d.transactions || []) || [];
                                    allTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
                                    
                                    return allTransactions.length > 0 ? (
                                        allTransactions.map((t, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 hover:bg-gray-50/50">
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-900">
                                                        {t.account?.name ? `Via ${t.account.name}` : "Pembayaran"}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {formatDate(t.transaction_date)} {t.description ? `• ${t.description}` : ""}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                    +{formatRupiah(t.amount)}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 rounded-xl border border-dashed">
                                            Belum ada riwayat pembayaran atau pemotongan gaji.
                                        </p>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <SecondaryButton onClick={() => { setDetailOpen(false); }}>
                                Tutup
                            </SecondaryButton>
                            {isOwner && Number(selectedContact.total_remaining) > 0 && (
                                <PrimaryButton
                                    onClick={() => openPaymentModal(selectedContact)}
                                    className="bg-red-600 hover:bg-red-700 gap-1.5"
                                >
                                    <Coins size={14} />
                                    <span>Catat Bayar / Potong Gaji</span>
                                </PrimaryButton>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Payment Modal */}
            <Modal show={isPaymentOpen} onClose={() => { setPaymentOpen(false); setSelectedContact(null); }} maxWidth="md">
                <form onSubmit={handlePaymentSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="text-red-600" size={20} />
                            <span>Catat Potong Gaji / Pembayaran</span>
                        </h3>
                        <button
                            type="button"
                            onClick={() => setPaymentOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {selectedDebt ? (
                        <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Nota/Invoice:</span>
                                <span className="font-mono font-semibold text-red-600">
                                    {selectedDebt.order ? selectedDebt.order.invoice_number : "Input Manual"}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Sisa Tagihan Nota:</span>
                                <span className="font-bold text-red-600">{formatRupiah(selectedDebt.remaining || 0)}</span>
                            </div>
                        </div>
                    ) : selectedContact ? (
                        <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Karyawan:</span>
                                <span className="font-semibold text-gray-900">{selectedContact.name}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Total Tagihan Bulan Ini:</span>
                                <span className="font-semibold text-gray-900">{formatRupiah(selectedContact.total_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Sisa Belum Lunas:</span>
                                <span className="font-bold text-red-600">{formatRupiah(selectedContact.total_remaining || 0)}</span>
                            </div>
                        </div>
                    ) : null}

                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Sumber Kas/Rekening" />
                            <select
                                className="w-full mt-1 px-4 py-2 rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm bg-white"
                                value={paymentForm.data.account_id}
                                onChange={(e) => paymentForm.setData("account_id", e.target.value)}
                                required
                            >
                                <option value="">-- Pilih Rekening/Kas --</option>
                                {accounts.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({formatRupiah(a.balance)})
                                    </option>
                                ))}
                            </select>
                            <InputError message={paymentForm.errors.account_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Kategori Transaksi (Pemasukan)" />
                            <select
                                className="w-full mt-1 px-4 py-2 rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm bg-white"
                                value={paymentForm.data.category_id}
                                onChange={(e) => paymentForm.setData("category_id", e.target.value)}
                                required
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {categories
                                    .filter((c) => c.type === "INCOME")
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                            </select>
                            <InputError message={paymentForm.errors.category_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Nominal Pembayaran / Potong" />
                            <TextInput
                                type="number"
                                className="w-full mt-1"
                                value={paymentForm.data.amount}
                                onChange={(e) => paymentForm.setData("amount", e.target.value)}
                                max={selectedDebt ? selectedDebt.remaining : selectedContact?.total_remaining}
                                step="0.01"
                                required
                            />
                            <InputError message={paymentForm.errors.amount} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Tanggal Transaksi" />
                            <TextInput
                                type="date"
                                className="w-full mt-1"
                                value={paymentForm.data.transaction_date}
                                onChange={(e) => paymentForm.setData("transaction_date", e.target.value)}
                                required
                            />
                            <InputError message={paymentForm.errors.transaction_date} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Catatan" />
                            <textarea
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm text-sm"
                                rows="3"
                                value={paymentForm.data.note}
                                onChange={(e) => paymentForm.setData("note", e.target.value)}
                                placeholder="Contoh: Potong gaji bulan Juli 2026"
                            />
                            <InputError message={paymentForm.errors.note} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton type="button" onClick={() => setPaymentOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={paymentForm.processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Simpan Pembayaran
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
