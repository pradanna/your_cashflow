// c:\PROJECT\WEBSITE\your_cashflow\resources\js\Pages\Transactions\Income.jsx

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import {
    TrendingUp,
    Plus,
    Filter,
    Search,
    Pencil,
    Trash2,
    X,
    Calendar,
    Wallet,
} from "lucide-react";
import { formatRupiah } from "@/Utils/format";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

export default function IncomeIndex({
    auth,
    transactions,
    totalIncome,
    accounts,
    categories,
    contacts,
    filters,
}) {
    // --- STATE ---
    const [dateStart, setDateStart] = useState(filters.date_start || "");
    const [dateEnd, setDateEnd] = useState(filters.date_end || "");
    const [accountId, setAccountId] = useState(filters.account_id || "");
    const [contactId, setContactId] = useState(filters.contact_id || "");

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    // --- FORMS ---
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        account_id: "",
        category_id: "",
        amount: "",
        transaction_date: new Date().toISOString().split("T")[0],
        description: "",
        type: "INCOME",
    });

    // --- HANDLERS: FILTER ---
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route("transactions.income"),
                {
                    date_start: dateStart,
                    date_end: dateEnd,
                    account_id: accountId,
                    contact_id: contactId,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [dateStart, dateEnd, accountId, contactId]);

    // --- HANDLERS: CRUD ---
    const openCreateModal = () => {
        setEditingTransaction(null);
        reset();
        setData({
            account_id: "",
            category_id: "",
            amount: "",
            transaction_date: new Date().toISOString().split("T")[0],
            description: "",
            type: "INCOME",
        });
        clearErrors();
        setCreateOpen(true);
    };

    const openEditModal = (trx) => {
        // Cek apakah transaksi terkait dengan Order atau Debt
        if (trx.order_id || trx.debt_id) {
            const confirmEdit = window.confirm(
                "Transaksi ini tercatat otomatis dari sistem Order/Piutang. Edit harus dilakukan melalui halaman Order. Lanjutkan?",
            );
            if (confirmEdit) {
                // Redirect ke halaman Order dengan filter pencarian (Invoice Number)
                const searchTerm = trx.order?.invoice_number || "";
                router.get(route("orders.index"), { search: searchTerm });
            }
            return;
        }

        setEditingTransaction(trx);
        setData({
            account_id: trx.account_id,
            category_id: trx.category_id || "",
            amount: trx.amount,
            transaction_date: trx.transaction_date,
            description: trx.description || "",
            type: "INCOME",
        });
        clearErrors();
        setCreateOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingTransaction) {
            put(route("transactions.update", editingTransaction.id), {
                onSuccess: () => setCreateOpen(false),
            });
        } else {
            post(route("transactions.store"), {
                onSuccess: () => setCreateOpen(false),
            });
        }
    };

    const openDeleteModal = (trx) => {
        setTransactionToDelete(trx);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        destroy(route("transactions.destroy", transactionToDelete.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Pemasukan (Income)
                </h2>
            }
        >
            <Head title="Pemasukan" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* 1. SUMMARY CARD */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">
                                Total Pemasukan (Periode Ini)
                            </p>
                            <h3 className="text-3xl font-bold text-green-600 mt-1">
                                {formatRupiah(totalIncome)}
                            </h3>
                        </div>
                        <div className="p-4 bg-green-50 text-green-600 rounded-full">
                            <TrendingUp size={32} />
                        </div>
                    </div>

                    {/* 2. FILTERS & ACTION */}
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-end lg:items-center">
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                            {/* Date Range */}
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                                <Calendar size={16} className="text-gray-400" />
                                <input
                                    type="date"
                                    className="border-none p-0 text-sm focus:ring-0 text-gray-600 w-32"
                                    value={dateStart}
                                    onChange={(e) =>
                                        setDateStart(e.target.value)
                                    }
                                />
                                <span className="text-gray-300">-</span>
                                <input
                                    type="date"
                                    className="border-none p-0 text-sm focus:ring-0 text-gray-600 w-32"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                />
                            </div>

                            {/* Account Filter */}
                            <select
                                className="px-4 py-2 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm bg-white shadow-sm"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                            >
                                <option value="">Semua Akun</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>

                            {/* Customer Filter */}
                            <select
                                className="px-4 py-2 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm bg-white shadow-sm"
                                value={contactId}
                                onChange={(e) => setContactId(e.target.value)}
                            >
                                <option value="">Semua Customer</option>
                                {contacts.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <PrimaryButton
                            onClick={openCreateModal}
                            className="bg-green-600 hover:bg-green-700 gap-2 shadow-green-200 shadow-sm"
                        >
                            <Plus size={18} />
                            Tambah Pemasukan
                        </PrimaryButton>
                    </div>

                    {/* 3. TABLE */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Akun</th>
                                    <th className="px-6 py-4 text-right">
                                        Jumlah
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.data.length > 0 ? (
                                    transactions.data.map((trx) => (
                                        <tr
                                            key={trx.id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                {new Date(
                                                    trx.transaction_date,
                                                ).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {trx.description || "-"}
                                                </div>
                                                {/* Tampilkan info jika terkait Order/Debt */}
                                                {(trx.order || trx.debt) && (
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                        {trx.order &&
                                                            `Ref: ${trx.order.invoice_number} `}
                                                        {trx.order?.contact &&
                                                            `(${trx.order.contact.name})`}
                                                        {trx.debt?.contact &&
                                                            `(${trx.debt.contact.name})`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                    {trx.category
                                                        ? trx.category.name
                                                        : "Umum"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {trx.account?.name}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">
                                                + {formatRupiah(trx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(trx)
                                                        }
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            openDeleteModal(trx)
                                                        }
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-12 text-center text-gray-400"
                                        >
                                            Belum ada data pemasukan pada
                                            periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {transactions.links && transactions.links.length > 3 && (
                        <div className="flex justify-center">
                            {/* Simple Pagination Links rendering if needed */}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL CREATE/EDIT --- */}
            <Modal
                show={isCreateOpen}
                onClose={() => setCreateOpen(false)}
                closeable={false}
            >
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            {editingTransaction
                                ? "Edit Pemasukan"
                                : "Tambah Pemasukan Baru"}
                        </h2>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Tanggal" />
                                <TextInput
                                    type="date"
                                    className="w-full mt-1"
                                    value={data.transaction_date}
                                    onChange={(e) =>
                                        setData(
                                            "transaction_date",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.transaction_date}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <InputLabel value="Jumlah (Rp)" />
                                <TextInput
                                    type="number"
                                    className="w-full mt-1"
                                    value={data.amount}
                                    onChange={(e) =>
                                        setData("amount", e.target.value)
                                    }
                                    placeholder="0"
                                    required
                                />
                                <InputError
                                    message={errors.amount}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Masuk ke Akun" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm"
                                value={data.account_id}
                                onChange={(e) =>
                                    setData("account_id", e.target.value)
                                }
                                required
                            >
                                <option value="">-- Pilih Akun --</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.account_id}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel value="Kategori" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm"
                                value={data.category_id}
                                onChange={(e) =>
                                    setData("category_id", e.target.value)
                                }
                                required
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.category_id}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel value="Keterangan / Deskripsi" />
                            <textarea
                                className="w-full mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm"
                                rows="3"
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                placeholder="Contoh: Bonus Tahunan, Jual Kardus Bekas..."
                            ></textarea>
                            <InputError
                                message={errors.description}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton
                            type="button"
                            onClick={() => setCreateOpen(false)}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Simpan
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL DELETE --- */}
            <Modal
                show={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                closeable={false}
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-4">
                        Hapus Transaksi?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Anda yakin ingin menghapus data pemasukan ini? Saldo
                        akun akan disesuaikan kembali.
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setDeleteOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <DangerButton
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            Hapus Permanen
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
