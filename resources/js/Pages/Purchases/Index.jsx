import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    Plus,
    Search,
    Filter,
    Eye,
    Calendar,
    FileText,
    X,
    Pencil,
    Trash2,
    Wallet,
    ShoppingBag,
} from "lucide-react";
import { formatRupiah } from "@/Utils/format";
import { getStatusBadge } from "@/Utils/badge";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Select from "react-select";

export default function PurchaseIndex({
    auth,
    purchases,
    filters,
    suppliers,
    stocks,
    accounts,
    categories,
    supplierItems,
}) {
    // --- STATE ---
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [dateStart, setDateStart] = useState(filters.date_start || "");
    const [dateEnd, setDateEnd] = useState(filters.date_end || "");

    // Modals
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isAddItemOpen, setAddItemOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isPaymentOpen, setPaymentOpen] = useState(false);

    const [editingPurchase, setEditingPurchase] = useState(null);
    const [purchaseToDelete, setPurchaseToDelete] = useState(null);
    const [purchaseToPay, setPurchaseToPay] = useState(null);

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
        contact_id: "",
        reference_number: "", // No. Nota Supplier
        transaction_date: new Date().toISOString().split("T")[0],
        status: "UNPAID",
        note: "",
        account_id: "",
        category_id: "",
        items: [],
    });

    const paymentForm = useForm({
        account_id: "",
        category_id: "",
        transaction_date: new Date().toISOString().split("T")[0],
        amount: "",
        note: "",
    });

    // Temporary Item State
    const [newItem, setNewItem] = useState({
        item_name: "",
        price: "",
        qty: 1,
    });

    // --- FILTERS ---
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route("purchases.index"),
                {
                    search,
                    status,
                    date_start: dateStart,
                    date_end: dateEnd,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300); // Debounce 300ms

        return () => clearTimeout(timer);
    }, [search, status, dateStart, dateEnd]);

    // --- AUTO NOTE ---
    useEffect(() => {
        if (data.items.length > 0) {
            const summary = data.items
                .map((item) => `${item.item_name} (${item.qty})`)
                .join(", ");

            // Hanya update jika summary berbeda dengan note yang sekarang
            // Ini mencegah loop tak terbatas
            if (summary !== data.note) {
                setData("note", summary);
            }
        }
    }, [data.items, data.note]);

    // --- HANDLERS: CREATE / EDIT ---
    const openCreateModal = () => {
        setEditingPurchase(null);
        reset();
        clearErrors();
        setCreateOpen(true);
    };

    const openEditModal = (purchase) => {
        setEditingPurchase(purchase);
        setData({
            contact_id: purchase.contact_id || "",
            reference_number: purchase.reference_number || "",
            transaction_date: purchase.transaction_date,
            status: purchase.status,
            note: purchase.note || "",
            account_id: purchase.transaction?.account_id || "",
            category_id: purchase.transaction?.category_id || "",
            items: purchase.items.map((item) => ({
                stock_id: item.stock_id,
                item_name: item.item_name,
                qty: parseFloat(item.qty),
                price: parseFloat(item.price),
            })),
        });
        clearErrors();
        setCreateOpen(true);
    };

    const handleSubmitPurchase = (e) => {
        e.preventDefault();
        if (editingPurchase) {
            put(route("purchases.update", editingPurchase.id), {
                onSuccess: () => setCreateOpen(false),
            });
        } else {
            post(route("purchases.store"), {
                onSuccess: () => setCreateOpen(false),
            });
        }
    };

    // --- HANDLERS: ITEMS ---
    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.item_name || !newItem.price || !newItem.qty) return;

        const itemToAdd = {
            ...newItem,
            qty: parseFloat(newItem.qty),
            price: parseFloat(newItem.price),
        };

        setData("items", [...data.items, itemToAdd]);
        setAddItemOpen(false);
        setNewItem({ item_name: "", price: "", qty: 1 });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = [...data.items];
        updatedItems.splice(index, 1);
        setData("items", updatedItems);
    };

    const handleSupplierItemSelect = (e) => {
        const selectedId = e.target.value;
        const selectedItem = supplierItems.find((s) => s.id == selectedId);

        if (selectedItem) {
            setNewItem({
                ...newItem,
                item_name: selectedItem.name,
                price: selectedItem.price,
            });
        } else {
            setNewItem({
                ...newItem,
                item_name: "",
                price: "",
            });
        }
    };

    // --- HANDLERS: DELETE ---
    const openDeleteModal = (purchase) => {
        setPurchaseToDelete(purchase);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        destroy(route("purchases.destroy", purchaseToDelete.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    // --- HANDLERS: PAYMENT ---
    const openPaymentModal = (purchase) => {
        setPurchaseToPay(purchase);
        paymentForm.setData({
            account_id: "",
            category_id: "",
            transaction_date: new Date().toISOString().split("T")[0],
            amount: purchase.debt ? purchase.debt.remaining : 0,
            note: "",
        });
        paymentForm.clearErrors();
        setPaymentOpen(true);
    };

    const handlePayment = (e) => {
        e.preventDefault();
        paymentForm.post(route("purchases.payment", purchaseToPay.id), {
            onSuccess: () => setPaymentOpen(false),
        });
    };

    const grandTotal = data.items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0,
    );

    const contactOptions = suppliers.map((contact) => ({
        value: contact.id,
        label: contact.name,
    }));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Daftar Pembelian" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Pembelian (Purchase)
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Kelola belanja stok dan pengeluaran modal usaha.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-red-200"
                    >
                        <Plus size={20} />
                        <span>Buat Pembelian</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                    <div className="flex-1 w-full relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Cari No. Nota atau Supplier..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto">
                        <select
                            className="px-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm bg-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Semua Status</option>
                            <option value="UNPAID">Belum Lunas</option>
                            <option value="PARTIAL">Cicilan</option>
                            <option value="PAID">Lunas</option>
                        </select>

                        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                className="border-none p-0 text-sm focus:ring-0 text-gray-600"
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                            />
                            <span className="text-gray-300">-</span>
                            <input
                                type="date"
                                className="border-none p-0 text-sm focus:ring-0 text-gray-600"
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">No. Nota</th>
                                    <th className="px-6 py-4">Supplier</th>
                                    <th className="px-6 py-4 text-right">
                                        Total
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Sisa Hutang
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {purchases.data.length > 0 ? (
                                    purchases.data.map((purchase) => (
                                        <tr
                                            key={purchase.id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {new Date(
                                                    purchase.transaction_date,
                                                ).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {purchase.reference_number ||
                                                    "-"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {purchase.contact ? (
                                                    purchase.contact.name
                                                ) : (
                                                    <span className="text-gray-400 italic">
                                                        Umum
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                {formatRupiah(
                                                    purchase.grand_total,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-red-600">
                                                {purchase.status === "PAID"
                                                    ? "-"
                                                    : purchase.debt
                                                      ? formatRupiah(
                                                            purchase.debt
                                                                .remaining,
                                                        )
                                                      : formatRupiah(
                                                            purchase.grand_total,
                                                        )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                                                        purchase.status,
                                                    )}`}
                                                >
                                                    {purchase.status ===
                                                    "UNPAID"
                                                        ? "BELUM LUNAS"
                                                        : purchase.status}
                                                </span>
                                                {purchase.status === "PAID" &&
                                                    purchase.transaction
                                                        ?.account && (
                                                        <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                                                            <Wallet size={10} />{" "}
                                                            {
                                                                purchase
                                                                    .transaction
                                                                    .account
                                                                    .name
                                                            }
                                                        </div>
                                                    )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={route(
                                                            "purchases.show",
                                                            purchase.id,
                                                        )}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    {purchase.status !==
                                                        "PAID" && (
                                                        <button
                                                            onClick={() =>
                                                                openPaymentModal(
                                                                    purchase,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                            title="Bayar Hutang"
                                                        >
                                                            <Wallet size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(
                                                                purchase,
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                purchase,
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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
                                            colSpan="7"
                                            className="px-6 py-12 text-center text-gray-400"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <ShoppingBag
                                                    size={32}
                                                    className="text-gray-300"
                                                />
                                                <p>Belum ada data pembelian.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {purchases.links && purchases.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
                            <div className="flex gap-1">
                                {purchases.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || "#"}
                                        className={`px-3 py-1 rounded-lg text-sm ${
                                            link.active
                                                ? "bg-red-600 text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                        } ${!link.url && "opacity-50 cursor-not-allowed"}`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL CREATE/EDIT PURCHASE --- */}
            <Modal
                show={isCreateOpen}
                onClose={() => setCreateOpen(false)}
                maxWidth="7xl"
                closeable={false}
            >
                <form onSubmit={handleSubmitPurchase} className="p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingPurchase
                                ? "Edit Pembelian"
                                : "Buat Pembelian Baru"}
                        </h2>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Info */}
                        <div className="space-y-5">
                            <h3 className="font-semibold text-gray-700 border-b pb-2">
                                Informasi Transaksi
                            </h3>
                            <div>
                                <InputLabel value="Supplier" />
                                <Select
                                    className="mt-1"
                                    classNamePrefix="react-select" // Berguna untuk styling custom
                                    options={contactOptions}
                                    // Cari objek yang value-nya sama dengan data.contact_id agar label tetap muncul
                                    value={contactOptions.find(
                                        (opt) => opt.value === data.contact_id,
                                    )}
                                    onChange={(selectedOption) =>
                                        setData(
                                            "supplier_id",
                                            selectedOption
                                                ? selectedOption.value
                                                : "",
                                        )
                                    }
                                    placeholder="-- Pilih Supplier --"
                                    isClearable // Agar bisa dikosongkan (tombol X)
                                    isSearchable // Fitur pencarian otomatis
                                />
                                <InputError
                                    message={errors.contact_id}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel value="No. Nota Supplier (Reference)" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.reference_number}
                                    onChange={(e) =>
                                        setData(
                                            "reference_number",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: INV-SUP-001"
                                />
                                <InputError
                                    message={errors.reference_number}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value="Tanggal Transaksi" />
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
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Status Pembayaran" />
                                    <select
                                        className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                        value={data.status}
                                        onChange={(e) =>
                                            setData("status", e.target.value)
                                        }
                                    >
                                        <option value="PAID">
                                            Lunas (Cash)
                                        </option>
                                        <option value="UNPAID">
                                            Hutang (Belum Lunas)
                                        </option>
                                    </select>
                                    <InputError
                                        message={errors.status}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            {data.status === "PAID" && (
                                <div className="grid grid-cols-2 gap-4 bg-red-50 p-4 rounded-lg border border-red-100">
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold text-red-700 mb-2 uppercase tracking-wider">
                                            Sumber Dana (Pengeluaran)
                                        </p>
                                    </div>
                                    <div>
                                        <InputLabel value="Ambil dari Akun" />
                                        <select
                                            className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                                            value={data.account_id}
                                            onChange={(e) =>
                                                setData(
                                                    "account_id",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                -- Pilih Akun --
                                            </option>
                                            {accounts.map((acc) => (
                                                <option
                                                    key={acc.id}
                                                    value={acc.id}
                                                >
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
                                        <InputLabel value="Kategori Pengeluaran" />
                                        <select
                                            className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                                            value={data.category_id}
                                            onChange={(e) =>
                                                setData(
                                                    "category_id",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                -- Pilih Kategori --
                                            </option>
                                            {categories.map((cat) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.category_id}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <InputLabel value="Catatan (Opsional)" />
                                <textarea
                                    className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                    rows="3"
                                    value={data.note}
                                    onChange={(e) =>
                                        setData("note", e.target.value)
                                    }
                                ></textarea>
                            </div>
                        </div>

                        {/* Right: Items */}
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center border-b pb-2 mb-4">
                                <h3 className="font-semibold text-gray-700">
                                    Item Pembelian
                                </h3>
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setAddItemOpen(true)}
                                    size="sm"
                                    className="gap-2 text-xs"
                                >
                                    <Plus size={14} /> Tambah Item
                                </SecondaryButton>
                            </div>

                            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                                <div className="overflow-y-auto max-h-[400px]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-2">
                                                    Item
                                                </th>
                                                <th className="px-4 py-2 text-center">
                                                    Qty
                                                </th>
                                                <th className="px-4 py-2 text-right">
                                                    Total
                                                </th>
                                                <th className="px-4 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {data.items.length > 0 ? (
                                                data.items.map(
                                                    (item, index) => (
                                                        <tr
                                                            key={index}
                                                            className="bg-white"
                                                        >
                                                            <td className="px-4 py-2">
                                                                <div className="font-medium text-gray-900">
                                                                    {
                                                                        item.item_name
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    @{" "}
                                                                    {formatRupiah(
                                                                        item.price,
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                {item.qty}
                                                            </td>
                                                            <td className="px-4 py-2 text-right font-medium">
                                                                {formatRupiah(
                                                                    item.price *
                                                                        item.qty,
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleRemoveItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="4"
                                                        className="px-4 py-8 text-center text-gray-400 text-xs"
                                                    >
                                                        Belum ada item
                                                        ditambahkan.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-auto bg-white border-t border-gray-200 p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">
                                            Grand Total
                                        </span>
                                        <span className="text-xl font-bold text-red-600">
                                            {formatRupiah(grandTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <InputError
                                message={errors.items}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                        <SecondaryButton
                            type="button"
                            onClick={() => setCreateOpen(false)}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {editingPurchase
                                ? "Simpan Perubahan"
                                : "Simpan Pembelian"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL ADD ITEM --- */}
            <Modal
                show={isAddItemOpen}
                onClose={() => setAddItemOpen(false)}
                maxWidth="md"
                closeable={false}
            >
                <form onSubmit={handleAddItem} className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Tambah Item Belanja
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Pilih Item dari Supplier" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                onChange={handleSupplierItemSelect}
                            >
                                <option value="">-- Item Manual --</option>
                                {supplierItems
                                    .filter(
                                        (s) =>
                                            !data.contact_id ||
                                            s.contact_id == data.contact_id,
                                    )
                                    .map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({formatRupiah(s.price)})
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Nama Item" />
                            <TextInput
                                className="w-full mt-1"
                                value={newItem.item_name}
                                onChange={(e) =>
                                    setNewItem({
                                        ...newItem,
                                        item_name: e.target.value,
                                    })
                                }
                                placeholder="Nama barang..."
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Harga Beli (Satuan)" />
                                <TextInput
                                    type="number"
                                    className="w-full mt-1"
                                    value={newItem.price}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            price: e.target.value,
                                        })
                                    }
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Qty" />
                                <TextInput
                                    type="number"
                                    className="w-full mt-1"
                                    value={newItem.qty}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            qty: e.target.value,
                                        })
                                    }
                                    placeholder="1"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton
                            type="button"
                            onClick={() => setAddItemOpen(false)}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Tambah
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
                        Hapus Pembelian?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Anda yakin ingin menghapus data pembelian ini? Data
                        hutang dan transaksi pengeluaran terkait juga akan
                        dihapus.
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

            {/* --- MODAL PAYMENT (BAYAR HUTANG) --- */}
            <Modal
                show={isPaymentOpen}
                onClose={() => setPaymentOpen(false)}
                closeable={false}
                maxWidth="md"
            >
                <form onSubmit={handlePayment} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            Bayar Hutang
                        </h2>
                        <button
                            type="button"
                            onClick={() => setPaymentOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm text-gray-600">Sisa Hutang:</p>
                        <p className="text-xl font-bold text-red-600">
                            {purchaseToPay?.debt
                                ? formatRupiah(purchaseToPay.debt.remaining)
                                : formatRupiah(0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Ref: {purchaseToPay?.reference_number}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Tanggal Bayar" />
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
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Kategori Pengeluaran" />
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
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Jumlah Bayar" />
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
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton onClick={() => setPaymentOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
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
