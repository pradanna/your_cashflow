// c:\PROJECT\WEBSITE\your_cashflow\resources\js\Pages\Orders\Index.jsx

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
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

export default function OrderIndex({
    orders,
    filters,
    contacts,
    items,
    accounts,
    categories,
    suppliers,
    stocks,
    supplierItems,
}) {
    // State untuk filter
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [dateStart, setDateStart] = useState(filters.date_start || "");
    const [dateEnd, setDateEnd] = useState(filters.date_end || "");

    // State Modal
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isAddItemOpen, setAddItemOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isPaymentOpen, setPaymentOpen] = useState(false);
    const [isPurchaseOpen, setPurchaseOpen] = useState(false);

    const [editingOrder, setEditingOrder] = useState(null);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [orderToPay, setOrderToPay] = useState(null);
    const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

    // Form Order
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
        contact_id: "",
        transaction_date: new Date().toISOString().split("T")[0],
        status: "UNPAID",
        note: "",
        account_id: "",
        category_id: "",
        items: [],
    });

    // Form Payment
    const paymentForm = useForm({
        account_id: "",
        category_id: "",
        transaction_date: new Date().toISOString().split("T")[0],
        amount: "",
        note: "",
    });

    // Form Purchase (Modal)
    const purchaseForm = useForm({
        order_id: "",
        contact_id: "",
        reference_number: "",
        transaction_date: new Date().toISOString().split("T")[0],
        status: "UNPAID",
        note: "",
        account_id: "",
        category_id: "",
        items: [],
    });

    // State Temporary Item Purchase
    const [newPurchaseItem, setNewPurchaseItem] = useState({
        item_name: "",
        price: "",
        qty: 1,
    });

    // State Temporary Item (untuk form tambah item)
    const [newItem, setNewItem] = useState({
        item_id: "",
        item_name: "",
        price: "",
        qty: 1,
    });

    // Debounce search / auto-submit filter
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route("orders.index"),
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

    // --- HANDLERS CREATE ORDER ---

    const openCreateModal = () => {
        setEditingOrder(null);
        reset();
        setCreateOpen(true);
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        setData({
            contact_id: order.contact_id || "",
            transaction_date: order.transaction_date,
            status: order.status,
            note: order.note || "",
            // Ambil account/category dari relasi transaction jika ada (dan status PAID)
            account_id: order.transaction?.account_id || "",
            category_id: order.transaction?.category_id || "",
            items: order.items.map((item) => ({
                item_id: item.item_id,
                item_name: item.item_name,
                qty: parseFloat(item.qty),
                price: parseFloat(item.price),
            })),
        });
        setCreateOpen(true);
    };

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
        // Reset new item form
        setNewItem({ item_id: "", item_name: "", price: "", qty: 1 });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = [...data.items];
        updatedItems.splice(index, 1);
        setData("items", updatedItems);
    };

    const handleItemSelect = (e) => {
        const selectedId = e.target.value;
        const selectedItem = items.find((i) => i.id == selectedId);

        if (selectedItem) {
            setNewItem({
                ...newItem,
                item_id: selectedId,
                item_name: selectedItem.name,
                price: selectedItem.price,
            });
        } else {
            setNewItem({
                ...newItem,
                item_id: "",
                item_name: "",
                price: "",
            });
        }
    };

    const handleSubmitOrder = (e) => {
        e.preventDefault();
        if (editingOrder) {
            put(route("orders.update", editingOrder.id), {
                onSuccess: () => setCreateOpen(false),
            });
        } else {
            post(route("orders.store"), {
                onSuccess: () => setCreateOpen(false),
            });
        }
    };

    const openDeleteModal = (order) => {
        setOrderToDelete(order);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        destroy(route("orders.destroy", orderToDelete.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    // --- HANDLERS PAYMENT ---
    const openPaymentModal = (order) => {
        setOrderToPay(order);
        // Reset form and set default values explicitly to avoid stale state
        paymentForm.setData({
            account_id: "",
            category_id: "",
            transaction_date: new Date().toISOString().split("T")[0],
            amount: order.debt ? order.debt.remaining : 0,
            note: "",
        });
        paymentForm.clearErrors();
        setPaymentOpen(true);
    };

    const handlePayment = (e) => {
        e.preventDefault();
        paymentForm.post(route("orders.payment", orderToPay.id), {
            onSuccess: () => setPaymentOpen(false),
        });
    };

    // --- HANDLERS PURCHASE MODAL ---
    const openPurchaseModal = (order) => {
        setSelectedOrderForModal(order);
        purchaseForm.reset();
        purchaseForm.setData({
            order_id: order.id,
            contact_id: "",
            reference_number: "",
            transaction_date: new Date().toISOString().split("T")[0],
            status: "UNPAID",
            note: `Modal untuk Order ${order.invoice_number}`,
            account_id: "",
            category_id: "",
            items: [],
        });
        purchaseForm.clearErrors();
        setPurchaseOpen(true);
    };

    const handleAddPurchaseItem = () => {
        if (
            !newPurchaseItem.item_name ||
            !newPurchaseItem.price ||
            !newPurchaseItem.qty
        )
            return;
        purchaseForm.setData("items", [
            ...purchaseForm.data.items,
            { ...newPurchaseItem },
        ]);
        setNewPurchaseItem({ item_name: "", price: "", qty: 1 });
    };

    const handleRemovePurchaseItem = (index) => {
        const items = [...purchaseForm.data.items];
        items.splice(index, 1);
        purchaseForm.setData("items", items);
    };

    const handleSupplierItemSelect = (e) => {
        const item = supplierItems.find((i) => i.id == e.target.value);
        if (item) {
            setNewPurchaseItem({
                ...newPurchaseItem,
                item_name: item.name,
                price: item.price,
            });
        }
    };

    const submitPurchase = (e) => {
        e.preventDefault();
        purchaseForm.post(route("purchases.store"), {
            onSuccess: () => setPurchaseOpen(false),
        });
    };

    const grandTotal = data.items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0,
    );

    return (
        <AuthenticatedLayout>
            <Head title="Daftar Order" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Penjualan (Order)
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Kelola transaksi penjualan dan faktur pelanggan.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-red-200"
                    >
                        <Plus size={20} />
                        <span>Buat Order Baru</span>
                    </button>
                </div>

                {/* Filter Section */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                    <div className="flex-1 w-full relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Cari No. Invoice atau Pelanggan..."
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

                {/* Table Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">No. Invoice</th>
                                    <th className="px-6 py-4">Pelanggan</th>
                                    <th className="px-6 py-4 text-right">
                                        Total
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Sisa Tagihan
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Modal
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Profit
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
                                {orders.data.length > 0 ? (
                                    orders.data.map((order) => {
                                        // Hitung Modal & Profit
                                        const modalTotal =
                                            order.purchases?.reduce(
                                                (sum, p) =>
                                                    sum +
                                                    parseFloat(p.grand_total),
                                                0,
                                            ) || 0;
                                        const profit =
                                            parseFloat(order.grand_total) -
                                            modalTotal;

                                        return (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                    {new Date(
                                                        order.transaction_date,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {order.invoice_number}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {order.contact ? (
                                                        order.contact.name
                                                    ) : (
                                                        <span className="text-gray-400 italic">
                                                            Umum (No Contact)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                    {formatRupiah(
                                                        order.grand_total,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-red-600">
                                                    {order.status === "PAID"
                                                        ? "-"
                                                        : order.debt
                                                          ? formatRupiah(
                                                                order.debt
                                                                    .remaining,
                                                            )
                                                          : formatRupiah(
                                                                order.grand_total,
                                                            )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-red-500">
                                                    {modalTotal > 0
                                                        ? formatRupiah(
                                                              modalTotal,
                                                          )
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-blue-600">
                                                    {formatRupiah(profit)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(order.status)}`}
                                                    >
                                                        {order.status ===
                                                        "UNPAID"
                                                            ? "BELUM LUNAS"
                                                            : order.status}
                                                    </span>
                                                    {order.status === "PAID" &&
                                                        order.transaction
                                                            ?.account && (
                                                            <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                                                                <Wallet
                                                                    size={10}
                                                                />{" "}
                                                                {
                                                                    order
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
                                                                "orders.show",
                                                                order.id,
                                                            )}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                openPurchaseModal(
                                                                    order,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                                                            title="Input Modal / Purchase"
                                                        >
                                                            <ShoppingBag
                                                                size={16}
                                                            />
                                                        </button>
                                                        {order.status !==
                                                            "PAID" && (
                                                            <button
                                                                onClick={() =>
                                                                    openPaymentModal(
                                                                        order,
                                                                    )
                                                                }
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                                title="Bayar / Cicil"
                                                            >
                                                                <Wallet
                                                                    size={16}
                                                                />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    order,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                                            title="Edit Order"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    order,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                            title="Hapus Order"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-12 text-center text-gray-400"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText
                                                    size={32}
                                                    className="text-gray-300"
                                                />
                                                <p>
                                                    Belum ada data order yang
                                                    ditemukan.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {orders.links && orders.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
                            <div className="flex gap-1">
                                {orders.links.map((link, i) => (
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

            {/* --- MODAL CREATE ORDER --- */}
            <Modal
                show={isCreateOpen}
                onClose={() => setCreateOpen(false)}
                maxWidth="7xl"
                closeable={false}
            >
                <form onSubmit={handleSubmitOrder} className="p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingOrder ? "Edit Order" : "Buat Order Baru"}
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
                        {/* KIRI: Informasi Order */}
                        <div className="space-y-5">
                            <h3 className="font-semibold text-gray-700 border-b pb-2">
                                Informasi Transaksi
                            </h3>

                            <div>
                                <InputLabel value="Pelanggan" />
                                <select
                                    className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                    value={data.contact_id}
                                    onChange={(e) =>
                                        setData("contact_id", e.target.value)
                                    }
                                >
                                    <option value="">
                                        -- Pilih Pelanggan --
                                    </option>
                                    {contacts.map((contact) => (
                                        <option
                                            key={contact.id}
                                            value={contact.id}
                                        >
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
                                <InputLabel value="No. Invoice" />
                                <TextInput
                                    className="w-full mt-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                                    value={
                                        editingOrder
                                            ? editingOrder.invoice_number
                                            : "Otomatis (INV/...)"
                                    }
                                    disabled
                                />
                                <p
                                    className="text-xs text-gray-400 mt-1"
                                    hidden={!!editingOrder}
                                >
                                    Nomor invoice akan digenerate otomatis oleh
                                    sistem.
                                </p>
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
                                        <option value="PAID">Lunas</option>
                                        <option value="UNPAID">
                                            Piutang (Belum Lunas)
                                        </option>
                                    </select>
                                    <InputError
                                        message={errors.status}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            {/* Conditional Input: Jika Lunas, pilih Akun & Kategori */}
                            {data.status === "PAID" && (
                                <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold text-green-700 mb-2 uppercase tracking-wider">
                                            Detail Pembayaran Masuk
                                        </p>
                                    </div>
                                    <div>
                                        <InputLabel value="Masuk ke Akun" />
                                        <select
                                            className="w-full mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm text-sm"
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
                                        <InputLabel value="Kategori Pemasukan" />
                                        <select
                                            className="w-full mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm text-sm"
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
                                    placeholder="Catatan tambahan untuk order ini..."
                                ></textarea>
                                <InputError
                                    message={errors.note}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        {/* KANAN: Item Pembelian */}
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

                                {/* Grand Total Footer */}
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
                            {editingOrder ? "Simpan Perubahan" : "Simpan Order"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL TAMBAH ITEM (NESTED) --- */}
            <Modal
                show={isAddItemOpen}
                onClose={() => setAddItemOpen(false)}
                maxWidth="md"
                closeable={false}
            >
                <form onSubmit={handleAddItem} className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Tambah Item
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Pilih Item (Opsional)" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                value={newItem.item_id}
                                onChange={handleItemSelect}
                            >
                                <option value="">-- Item Manual --</option>
                                {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({formatRupiah(item.price)})
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
                                placeholder="Contoh: Jasa Desain"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Harga Satuan" />
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
                        <div className="pt-2 text-right">
                            <p className="text-sm text-gray-500">
                                Subtotal:{" "}
                                <span className="font-bold text-gray-900">
                                    {formatRupiah(newItem.price * newItem.qty)}
                                </span>
                            </p>
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
                            Tambah ke List
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL INPUT PURCHASE (MODAL USAHA) --- */}
            <Modal
                show={isPurchaseOpen}
                onClose={() => setPurchaseOpen(false)}
                maxWidth="6xl"
                closeable={false}
            >
                <form onSubmit={submitPurchase} className="p-6">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Input Modal / Pengeluaran
                            </h2>
                            <p className="text-sm text-gray-500">
                                Untuk Order:{" "}
                                <span className="font-medium text-gray-800">
                                    {selectedOrderForModal?.invoice_number}
                                </span>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPurchaseOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* KIRI: Info Supplier & Pembayaran */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-700 border-b pb-2">
                                Data Supplier & Nota
                            </h3>

                            <div>
                                <InputLabel value="Supplier" />
                                <select
                                    className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                    value={purchaseForm.data.contact_id}
                                    onChange={(e) =>
                                        purchaseForm.setData(
                                            "contact_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        -- Pilih Supplier --
                                    </option>
                                    {suppliers?.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={purchaseForm.errors.contact_id}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <InputLabel value="No. Nota Supplier" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={purchaseForm.data.reference_number}
                                    onChange={(e) =>
                                        purchaseForm.setData(
                                            "reference_number",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: INV-SUP-001"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value="Tanggal" />
                                    <TextInput
                                        type="date"
                                        className="w-full mt-1"
                                        value={
                                            purchaseForm.data.transaction_date
                                        }
                                        onChange={(e) =>
                                            purchaseForm.setData(
                                                "transaction_date",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Status Bayar" />
                                    <select
                                        className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                        value={purchaseForm.data.status}
                                        onChange={(e) =>
                                            purchaseForm.setData(
                                                "status",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="UNPAID">Hutang</option>
                                        <option value="PAID">
                                            Lunas (Cash)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {purchaseForm.data.status === "PAID" && (
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 space-y-3">
                                    <div>
                                        <InputLabel value="Sumber Dana (Akun)" />
                                        <select
                                            className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                                            value={purchaseForm.data.account_id}
                                            onChange={(e) =>
                                                purchaseForm.setData(
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
                                    </div>
                                    <div>
                                        <InputLabel value="Kategori Pengeluaran" />
                                        <select
                                            className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                                            value={
                                                purchaseForm.data.category_id
                                            }
                                            onChange={(e) =>
                                                purchaseForm.setData(
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
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* KANAN: Items Table */}
                        <div className="flex flex-col h-full">
                            <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">
                                Item Pengeluaran
                            </h3>

                            {/* Form Tambah Item Kecil */}
                            <div className="bg-gray-50 p-3 rounded-lg mb-4 grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-4">
                                    <InputLabel
                                        value="Item (Pilih/Ketik)"
                                        className="text-xs"
                                    />
                                    <select
                                        className="w-full text-xs border-gray-300 rounded-md mb-1"
                                        onChange={handleSupplierItemSelect}
                                    >
                                        <option value="">-- Pilih --</option>
                                        {supplierItems
                                            ?.filter(
                                                (s) =>
                                                    !purchaseForm.data
                                                        .contact_id ||
                                                    s.contact_id ==
                                                        purchaseForm.data
                                                            .contact_id,
                                            )
                                            .map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                    </select>
                                    <TextInput
                                        className="w-full text-xs py-1"
                                        placeholder="Nama Item..."
                                        value={newPurchaseItem.item_name}
                                        onChange={(e) =>
                                            setNewPurchaseItem({
                                                ...newPurchaseItem,
                                                item_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-span-3">
                                    <InputLabel
                                        value="Harga"
                                        className="text-xs"
                                    />
                                    <TextInput
                                        type="number"
                                        className="w-full text-xs py-1"
                                        placeholder="0"
                                        value={newPurchaseItem.price}
                                        onChange={(e) =>
                                            setNewPurchaseItem({
                                                ...newPurchaseItem,
                                                price: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-span-2">
                                    <InputLabel
                                        value="Qty"
                                        className="text-xs"
                                    />
                                    <TextInput
                                        type="number"
                                        className="w-full text-xs py-1"
                                        placeholder="1"
                                        value={newPurchaseItem.qty}
                                        onChange={(e) =>
                                            setNewPurchaseItem({
                                                ...newPurchaseItem,
                                                qty: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-span-3">
                                    <SecondaryButton
                                        onClick={handleAddPurchaseItem}
                                        size="sm"
                                        className="w-full justify-center text-xs h-[34px]"
                                    >
                                        <Plus size={14} /> Tambah
                                    </SecondaryButton>
                                </div>
                            </div>

                            {/* Table Items */}
                            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
                                <div className="overflow-y-auto max-h-[300px]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 font-medium">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    Item
                                                </th>
                                                <th className="px-3 py-2 text-center">
                                                    Qty
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Total
                                                </th>
                                                <th className="px-3 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {purchaseForm.data.items.map(
                                                (item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-3 py-2">
                                                            {item.item_name}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {item.qty}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            {formatRupiah(
                                                                item.price *
                                                                    item.qty,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemovePurchaseItem(
                                                                        idx,
                                                                    )
                                                                }
                                                                className="text-red-500"
                                                            >
                                                                <Trash2
                                                                    size={14}
                                                                />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-gray-50 p-3 border-t flex justify-between items-center font-bold">
                                    <span>Total Pengeluaran</span>
                                    <span className="text-red-600">
                                        {formatRupiah(
                                            purchaseForm.data.items.reduce(
                                                (sum, item) =>
                                                    sum + item.price * item.qty,
                                                0,
                                            ),
                                        )}
                                    </span>
                                </div>
                            </div>
                            <InputError
                                message={purchaseForm.errors.items}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <SecondaryButton onClick={() => setPurchaseOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={purchaseForm.processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Simpan Modal
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL DELETE CONFIRMATION --- */}
            <Modal
                show={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                closeable={false}
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-4">
                        Hapus Order?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Anda yakin ingin menghapus order{" "}
                        <strong>{orderToDelete?.invoice_number}</strong>? Data
                        transaksi keuangan atau piutang yang terkait juga akan
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

            {/* --- MODAL PAYMENT --- */}
            <Modal
                show={isPaymentOpen}
                onClose={() => setPaymentOpen(false)}
                closeable={false}
                maxWidth="md"
            >
                <form onSubmit={handlePayment} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            Input Pembayaran
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
                        <p className="text-sm text-gray-600">Sisa Tagihan:</p>
                        <p className="text-xl font-bold text-red-600">
                            {orderToPay?.debt
                                ? formatRupiah(orderToPay.debt.remaining)
                                : formatRupiah(0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Invoice: {orderToPay?.invoice_number}
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
                            <InputError
                                message={paymentForm.errors.transaction_date}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel value="Masuk ke Akun" />
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
                            <InputError
                                message={paymentForm.errors.account_id}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel value="Kategori (Income)" />
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
                            <InputError
                                message={paymentForm.errors.category_id}
                                className="mt-1"
                            />
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
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Simpan Pembayaran
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
