import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import { formatRupiah } from "@/Utils/format";
import {
    Plus,
    Search,
    Calendar,
    ArrowUpDown,
    Pencil,
    Trash2,
    Wallet,
    X,
} from "lucide-react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

const DebtStatusBadge = ({ status }) => {
    const statusClasses = {
        UNPAID: "bg-red-100 text-red-800",
        PARTIAL: "bg-yellow-100 text-yellow-800",
        PAID: "bg-green-100 text-green-800",
    };
    const statusText = {
        UNPAID: "Belum Lunas",
        PARTIAL: "Lunas Sebagian",
        PAID: "Lunas",
    };
    return (
        <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}
        >
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
                        className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <Link
                        key={key}
                        className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-red-500 focus:text-red-500 ${
                            link.active ? "bg-white" : ""
                        }`}
                        href={link.url}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </div>
    );
};

export default function DebtIndex({
    auth,
    debts,
    filters,
    contacts,
    accounts,
    categories,
}) {
    const [activeTab, setActiveTab] = useState(filters.type || "PAYABLE");
    const [search, setSearch] = useState(filters.search || "");
    const [dateStart, setDateStart] = useState(filters.date_start || "");
    const [dateEnd, setDateEnd] = useState(filters.date_end || "");
    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDir, setSortDir] = useState(filters.sort_dir || "desc");

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isPaymentOpen, setPaymentOpen] = useState(false);

    const [editingDebt, setEditingDebt] = useState(null);
    const [deletingDebt, setDeletingDebt] = useState(null);
    const [paymentDebt, setPaymentDebt] = useState(null);

    // Form untuk Create & Edit
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
        contact_id: "",
        type: activeTab,
        amount: "",
        due_date: "",
        note: "",
    });

    // Form khusus Payment
    const paymentForm = useForm({
        account_id: "",
        category_id: "",
        amount: "",
        transaction_date: new Date().toISOString().split("T")[0],
        note: "",
    });

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    // Effect untuk menangani filter
    useEffect(() => {
        const params = {
            type: activeTab,
            search,
            date_start: dateStart,
            date_end: dateEnd,
            sort_by: sortBy,
            sort_dir: sortDir,
        };
        const timer = setTimeout(() => {
            router.get(route("debts.index"), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [activeTab, search, dateStart, dateEnd, sortBy, sortDir]);

    useEffect(() => {
        setData("type", activeTab);
    }, [activeTab]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortDir("asc");
        }
    };

    const openCreateModal = () => {
        setEditingDebt(null);
        reset();
        clearErrors();

        // Default jatuh tempo 1 minggu dari sekarang
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const defaultDueDate = nextWeek.toISOString().split("T")[0];

        setData((data) => ({
            ...data,
            type: activeTab,
            due_date: defaultDueDate,
        }));
        setCreateOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingDebt) {
            put(route("debts.update", editingDebt.id), {
                onSuccess: () => setEditOpen(false),
            });
        } else {
            post(route("debts.store"), {
                onSuccess: () => setCreateOpen(false),
            });
        }
    };

    const openEditModal = (debt) => {
        if (debt.order_id) {
            if (
                confirm(
                    "Data ini terhubung dengan Penjualan. Edit di halaman Penjualan?",
                )
            ) {
                router.get(route("orders.index"), {
                    search: debt.order.invoice_number,
                });
            }
            return;
        }
        if (debt.purchase_id) {
            if (
                confirm(
                    "Data ini terhubung dengan Pembelian. Edit di halaman Pembelian?",
                )
            ) {
                router.get(route("purchases.index"), {
                    search: debt.purchase.reference_number,
                });
            }
            return;
        }
        // Manual Debt
        setEditingDebt(debt);
        setData({
            contact_id: debt.contact_id,
            type: debt.type,
            amount: debt.amount,
            due_date: debt.due_date || "",
            note: debt.note || "",
        });
        clearErrors();
        setEditOpen(true);
    };

    const openDeleteModal = (debt) => {
        if (debt.order_id) {
            if (
                confirm(
                    "Data ini terhubung dengan Penjualan. Hapus harus dilakukan di halaman Penjualan. Ke sana sekarang?",
                )
            ) {
                router.get(route("orders.index"), {
                    search: debt.order.invoice_number,
                });
            }
            return;
        }
        if (debt.purchase_id) {
            if (
                confirm(
                    "Data ini terhubung dengan Pembelian. Hapus harus dilakukan di halaman Pembelian. Ke sana sekarang?",
                )
            ) {
                router.get(route("purchases.index"), {
                    search: debt.purchase.reference_number,
                });
            }
            return;
        }
        setDeletingDebt(debt);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        destroy(route("debts.destroy", deletingDebt.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    const openPaymentModal = (debt) => {
        setPaymentDebt(debt);
        paymentForm.reset();
        paymentForm.clearErrors();
        paymentForm.setData({
            account_id: "",
            category_id: "",
            amount: "", // Kosongkan agar user input, atau bisa default ke remaining
            transaction_date: new Date().toISOString().split("T")[0],
            note: "",
        });
        setPaymentOpen(true);
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        let url = route("debts.payment", paymentDebt.id);
        if (paymentDebt.order_id)
            url = route("orders.payment", paymentDebt.order_id);
        if (paymentDebt.purchase_id)
            url = route("purchases.payment", paymentDebt.purchase_id);

        paymentForm.post(url, {
            onSuccess: () => setPaymentOpen(false),
            preserveScroll: true,
        });
    };

    const TabButton = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tabName ? "bg-red-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
        >
            {label}
        </button>
    );

    const SortableHeader = ({ column, label }) => (
        <th
            className="px-6 py-3 cursor-pointer"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center gap-1">
                {label}
                {sortBy === column && <ArrowUpDown size={14} />}
            </div>
        </th>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Manajemen Hutang & Piutang
                </h2>
            }
        >
            <Head title="Hutang & Piutang" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-2 p-1 bg-gray-50 rounded-lg border">
                            <TabButton
                                tabName="PAYABLE"
                                label="Hutang (Payable)"
                            />
                            <TabButton
                                tabName="RECEIVABLE"
                                label="Piutang (Receivable)"
                            />
                        </div>
                        <PrimaryButton
                            onClick={openCreateModal}
                            className="gap-2"
                        >
                            <Plus size={18} />
                            Tambah{" "}
                            {activeTab === "PAYABLE" ? "Hutang" : "Piutang"}
                        </PrimaryButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <TextInput
                                type="text"
                                className="w-full pl-10"
                                placeholder={`Cari ${activeTab === "PAYABLE" ? "Supplier" : "Customer"}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                className="border-none p-0 text-sm focus:ring-0 text-gray-600 w-full"
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                            />
                            <span className="text-gray-300">-</span>
                            <input
                                type="date"
                                className="border-none p-0 text-sm focus:ring-0 text-gray-600 w-full"
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b text-gray-500 font-medium">
                                <tr>
                                    <SortableHeader
                                        column="contact_name"
                                        label={
                                            activeTab === "PAYABLE"
                                                ? "Supplier"
                                                : "Customer"
                                        }
                                    />
                                    <th className="px-6 py-3">Referensi</th>
                                    <th className="px-6 py-3">
                                        Tgl Jatuh Tempo
                                    </th>
                                    <SortableHeader
                                        column="amount"
                                        label="Total"
                                    />
                                    <SortableHeader
                                        column="remaining"
                                        label="Sisa"
                                    />
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {debts.data.length > 0 ? (
                                    debts.data.map((debt) => (
                                        <tr
                                            key={debt.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {debt.contact?.name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {debt.purchase
                                                    ? `Beli: ${debt.purchase.reference_number}`
                                                    : ""}
                                                {debt.order
                                                    ? `Jual: ${debt.order.invoice_number}`
                                                    : ""}
                                                {debt.note && (
                                                    <div className="text-xs text-gray-400 italic mt-0.5">
                                                        "{debt.note}"
                                                    </div>
                                                )}
                                                {!debt.purchase &&
                                                    !debt.order &&
                                                    "-"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {debt.due_date
                                                    ? formatDate(debt.due_date)
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatRupiah(debt.amount)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-red-600">
                                                {formatRupiah(debt.remaining)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <DebtStatusBadge
                                                    status={debt.status}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    {debt.status !== "PAID" && (
                                                        <button
                                                            onClick={() =>
                                                                openPaymentModal(
                                                                    debt,
                                                                )
                                                            }
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                                            title="Bayar"
                                                        >
                                                            <Wallet size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(debt)
                                                        }
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                debt,
                                                            )
                                                        }
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Hapus"
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
                                            Tidak ada data{" "}
                                            {activeTab === "PAYABLE"
                                                ? "hutang"
                                                : "piutang"}{" "}
                                            pada periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {debts.data.length > 0 && (
                        <Pagination links={debts.links} />
                    )}
                </div>
            </div>

            {/* MODAL CREATE / EDIT */}
            <Modal
                show={isCreateOpen || isEditOpen}
                onClose={() => {
                    setCreateOpen(false);
                    setEditOpen(false);
                }}
            >
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {editingDebt ? "Edit" : "Tambah"}{" "}
                        {activeTab === "PAYABLE" ? "Hutang" : "Piutang"} Manual
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        {editingDebt
                            ? "Edit data hutang/piutang manual."
                            : `Gunakan form ini untuk mencatat ${activeTab === "PAYABLE" ? "hutang" : "piutang"} yang tidak berasal dari transaksi Pembelian atau Penjualan.`}
                    </p>

                    <div className="mt-6 space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="contact_id"
                                value={
                                    activeTab === "PAYABLE"
                                        ? "Supplier"
                                        : "Customer"
                                }
                            />
                            <select
                                id="contact_id"
                                className="mt-1 block w-full border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                value={data.contact_id}
                                onChange={(e) =>
                                    setData("contact_id", e.target.value)
                                }
                                required
                            >
                                <option value="">-- Pilih Kontak --</option>
                                {contacts.map((contact) => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.contact_id}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="amount" value="Jumlah" />
                            <TextInput
                                id="amount"
                                type="number"
                                className="mt-1 block w-full"
                                value={data.amount}
                                onChange={(e) =>
                                    setData("amount", e.target.value)
                                }
                                required
                                placeholder="0"
                            />
                            <InputError
                                message={errors.amount}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="due_date"
                                value="Tanggal Jatuh Tempo (Opsional)"
                            />
                            <TextInput
                                id="due_date"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.due_date}
                                onChange={(e) =>
                                    setData("due_date", e.target.value)
                                }
                            />
                            <InputError
                                message={errors.due_date}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="note"
                                value="Keterangan / Catatan (Opsional)"
                            />
                            <TextInput
                                id="note"
                                className="mt-1 block w-full"
                                value={data.note}
                                onChange={(e) =>
                                    setData("note", e.target.value)
                                }
                                placeholder="Contoh: Hutang operasional, Pinjaman sementara"
                            />
                            <InputError
                                message={errors.note}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton
                            onClick={() => {
                                setCreateOpen(false);
                                setEditOpen(false);
                            }}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={processing}>
                            Simpan
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* MODAL DELETE */}
            <Modal show={isDeleteOpen} onClose={() => setDeleteOpen(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-4">
                        Hapus Data?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Anda yakin ingin menghapus data ini? Tindakan ini tidak
                        dapat dibatalkan.
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setDeleteOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <DangerButton
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            Hapus
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            {/* MODAL PAYMENT */}
            <Modal show={isPaymentOpen} onClose={() => setPaymentOpen(false)}>
                <form onSubmit={handlePaymentSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            Bayar{" "}
                            {paymentDebt?.type === "PAYABLE"
                                ? "Hutang"
                                : "Piutang"}
                        </h2>
                        <button
                            type="button"
                            onClick={() => setPaymentOpen(false)}
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border text-sm">
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-500">Kontak:</span>
                            <span className="font-medium">
                                {paymentDebt?.contact?.name}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Sisa Tagihan:</span>
                            <span className="font-bold text-red-600">
                                {paymentDebt &&
                                    formatRupiah(paymentDebt.remaining)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Tanggal Pembayaran" />
                            <TextInput
                                type="date"
                                className="w-full mt-1"
                                value={paymentForm.data.transaction_date}
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "transaction_date",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            <InputError
                                message={paymentForm.errors.transaction_date}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel value="Sumber Dana (Akun)" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                value={paymentForm.data.account_id}
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "account_id",
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">-- Pilih Akun --</option>
                                {accounts?.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={paymentForm.errors.account_id}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel value="Kategori (Pos Anggaran)" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                value={paymentForm.data.category_id}
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "category_id",
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {categories?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={paymentForm.errors.category_id}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <InputLabel value="Jumlah Bayar" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        paymentForm.setData(
                                            "amount",
                                            paymentDebt?.remaining,
                                        )
                                    }
                                    className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                    Full Pay
                                </button>
                            </div>
                            <TextInput
                                type="number"
                                className="w-full mt-1"
                                value={paymentForm.data.amount}
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "amount",
                                        e.target.value,
                                    )
                                }
                                placeholder="0"
                                required
                            />
                            <InputError
                                message={paymentForm.errors.amount}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel value="Catatan (Opsional)" />
                            <TextInput
                                type="text"
                                className="w-full mt-1"
                                value={paymentForm.data.note}
                                onChange={(e) =>
                                    paymentForm.setData("note", e.target.value)
                                }
                                placeholder="Keterangan tambahan..."
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setPaymentOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={paymentForm.processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Bayar
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
