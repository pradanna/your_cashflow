import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import {
    Box,
    ArrowUp,
    ArrowDown,
    DollarSign,
    AlertTriangle,
    History,
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Package,
} from "lucide-react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import { formatRupiah } from "@/Utils/format";

export default function StockIndex({
    auth,
    stocks,
    mutations,
    stats,
    filters,
    contacts,
    accounts,
    categories,
}) {
    // --- STATE ---
    const [search, setSearch] = useState(filters.search || "");
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isAdjustOpen, setAdjustOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [adjustType, setAdjustType] = useState("IN"); // IN or OUT

    // --- FORMS ---
    const createForm = useForm({
        name: "",
        unit: "",
        qty: "",
        avg_cost: "",
        selling_price: "",
    });

    const editForm = useForm({
        name: "",
        unit: "",
        selling_price: "",
    });

    const adjustForm = useForm({
        type: "IN",
        qty: "",
        contact_id: "",
        account_id: "",
        category_id: "",
    });

    const deleteForm = useForm({});

    // --- HANDLERS ---

    // Search
    const handleSearch = (e) => {
        if (e.key === "Enter") {
            router.get(
                route("stocks.index"),
                { search },
                { preserveState: true, replace: true },
            );
        }
    };

    // Create
    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route("stocks.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    // Edit
    const openEdit = (stock) => {
        setSelectedStock(stock);
        editForm.setData({
            name: stock.name,
            unit: stock.unit,
            selling_price: stock.selling_price,
        });
        setEditOpen(true);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.put(route("stocks.update", selectedStock.id), {
            onSuccess: () => setEditOpen(false),
        });
    };

    // Adjust (In/Out)
    const openAdjust = (stock, type) => {
        setSelectedStock(stock);
        setAdjustType(type);
        adjustForm.setData({
            type: type,
            qty: "",
            contact_id: "",
            account_id: "",
            category_id: "",
        });
        setAdjustOpen(true);
    };

    const handleAdjust = (e) => {
        e.preventDefault();
        // Asumsi route: Route::post('/stocks/{stock}/adjust', [StockController::class, 'adjust'])->name('stocks.adjust');
        adjustForm.post(route("stocks.adjust", selectedStock.id), {
            onSuccess: () => {
                setAdjustOpen(false);
                adjustForm.reset();
            },
        });
    };

    // Delete
    const openDelete = (stock) => {
        setSelectedStock(stock);
        setDeleteOpen(true);
    };

    const handleDelete = (e) => {
        e.preventDefault();
        deleteForm.delete(route("stocks.destroy", selectedStock.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Stok Barang
                </h2>
            }
        >
            <Head title="Stok Barang" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    {/* 1. STATS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Asset Value */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Nilai Aset
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatRupiah(stats.total_asset_value)}
                                </p>
                            </div>
                        </div>

                        {/* Total Product Types */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Package size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Jenis Produk
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.total_product_types}{" "}
                                    <span className="text-sm font-normal text-gray-400">
                                        Item
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Low Stock Warning */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Stok Menipis (&lt;500)
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.low_stock_count}{" "}
                                    <span className="text-sm font-normal text-gray-400">
                                        Item
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. MAIN STOCK TABLE */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            {/* Search */}
                            <div className="relative w-full max-w-xs">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Cari nama barang..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearch}
                                />
                            </div>
                            {/* Add Button */}
                            <PrimaryButton
                                onClick={() => setCreateOpen(true)}
                                className="bg-red-600 hover:bg-red-700 gap-2"
                            >
                                <Plus size={16} />
                                Tambah Produk
                            </PrimaryButton>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">
                                            Nama Produk
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Stok
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Harga Modal (Avg)
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Harga Jual
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Total Aset
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stocks.data.length > 0 ? (
                                        stocks.data.map((stock) => (
                                            <tr
                                                key={stock.id}
                                                className="hover:bg-gray-50/50"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {stock.name}
                                                    <span className="block text-xs text-gray-400 font-normal">
                                                        {stock.unit}
                                                    </span>
                                                </td>
                                                <td
                                                    className={`px-6 py-4 text-right font-bold ${stock.qty < 500 ? "text-red-600" : "text-gray-700"}`}
                                                >
                                                    {parseFloat(
                                                        stock.qty,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-600">
                                                    {formatRupiah(
                                                        stock.avg_cost,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-600">
                                                    {formatRupiah(
                                                        stock.selling_price,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-900 font-medium">
                                                    {formatRupiah(
                                                        stock.qty *
                                                            stock.avg_cost,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                openAdjust(
                                                                    stock,
                                                                    "IN",
                                                                )
                                                            }
                                                            className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg"
                                                            title="Stok Masuk"
                                                        >
                                                            <ArrowUp
                                                                size={16}
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openAdjust(
                                                                    stock,
                                                                    "OUT",
                                                                )
                                                            }
                                                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                                                            title="Stok Keluar"
                                                        >
                                                            <ArrowDown
                                                                size={16}
                                                            />
                                                        </button>
                                                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                                        <button
                                                            onClick={() =>
                                                                openEdit(stock)
                                                            }
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openDelete(
                                                                    stock,
                                                                )
                                                            }
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
                                                <div className="flex flex-col items-center gap-2">
                                                    <Box
                                                        size={32}
                                                        className="text-gray-300"
                                                    />
                                                    <p>Belum ada data stok.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. HISTORY TABLE (MUTATIONS) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <History size={20} className="text-gray-400" />
                            Riwayat Aktivitas Stok
                        </h3>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4">Barang</th>
                                        <th className="px-6 py-4">Tipe</th>
                                        <th className="px-6 py-4 text-right">
                                            Jumlah
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Sisa Stok
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {mutations.length > 0 ? (
                                        mutations.map((mutation) => (
                                            <tr
                                                key={mutation.id}
                                                className="hover:bg-gray-50/50"
                                            >
                                                <td className="px-6 py-4 text-gray-600">
                                                    {new Date(
                                                        mutation.created_at,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {mutation.stock?.name ||
                                                        "Item Terhapus"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            mutation.type ===
                                                            "IN"
                                                                ? "bg-green-100 text-green-800"
                                                                : mutation.type ===
                                                                    "OUT"
                                                                  ? "bg-red-100 text-red-800"
                                                                  : "bg-blue-100 text-blue-800"
                                                        }`}
                                                    >
                                                        {mutation.type}
                                                    </span>
                                                </td>
                                                <td
                                                    className={`px-6 py-4 text-right font-bold ${
                                                        mutation.type === "OUT"
                                                            ? "text-red-600"
                                                            : "text-green-600"
                                                    }`}
                                                >
                                                    {mutation.type === "OUT"
                                                        ? "-"
                                                        : "+"}
                                                    {parseFloat(
                                                        mutation.qty,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-600">
                                                    {parseFloat(
                                                        mutation.current_qty,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-400 text-sm"
                                            >
                                                Belum ada riwayat aktivitas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Create Modal */}
            <Modal
                show={isCreateOpen}
                onClose={() => setCreateOpen(false)}
                closeable={false}
            >
                <form onSubmit={handleCreate} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            Tambah Produk Stok
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
                        <div>
                            <InputLabel value="Nama Produk" />
                            <TextInput
                                className="w-full mt-1"
                                value={createForm.data.name}
                                onChange={(e) =>
                                    createForm.setData("name", e.target.value)
                                }
                                required
                                placeholder="Contoh: Kertas A4"
                            />
                            <InputError
                                message={createForm.errors.name}
                                className="mt-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Unit" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={createForm.data.unit}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "unit",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="rim, pcs"
                                />
                                <InputError
                                    message={createForm.errors.unit}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Stok Awal" />
                                <TextInput
                                    type="number"
                                    className="w-full mt-1"
                                    value={createForm.data.qty}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "qty",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="0"
                                />
                                <InputError
                                    message={createForm.errors.qty}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Harga Modal (HPP)" />
                                <TextInput
                                    type="number"
                                    className="w-full mt-1"
                                    value={createForm.data.avg_cost}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "avg_cost",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="0"
                                />
                                <InputError
                                    message={createForm.errors.avg_cost}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Harga Jual Default" />
                                <TextInput
                                    type="number"
                                    className="w-full mt-1"
                                    value={createForm.data.selling_price}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "selling_price",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="0"
                                />
                                <InputError
                                    message={createForm.errors.selling_price}
                                    className="mt-2"
                                />
                            </div>
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
                            disabled={createForm.processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Simpan
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* 2. Edit Modal */}
            <Modal
                show={isEditOpen}
                onClose={() => setEditOpen(false)}
                closeable={false}
            >
                <form onSubmit={handleEdit} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">
                        Edit Produk
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Nama Produk" />
                            <TextInput
                                className="w-full mt-1"
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData("name", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={editForm.errors.name}
                                className="mt-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Unit" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={editForm.data.unit}
                                    onChange={(e) =>
                                        editForm.setData("unit", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={editForm.errors.unit}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel value="Harga Jual" />
                                <TextInput
                                    type="number"
                                    className="w-full mt-1"
                                    value={editForm.data.selling_price}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "selling_price",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={editForm.errors.selling_price}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                            *Stok dan Harga Modal hanya bisa diubah melalui
                            Transaksi atau Penyesuaian Stok.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton
                            type="button"
                            onClick={() => setEditOpen(false)}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={editForm.processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Update
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* 3. Adjust Modal (In/Out) */}
            <Modal
                show={isAdjustOpen}
                onClose={() => setAdjustOpen(false)}
                closeable={false}
            >
                <form onSubmit={handleAdjust} className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div
                            className={`p-2 rounded-lg ${adjustType === "IN" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                        >
                            {adjustType === "IN" ? (
                                <ArrowUp size={24} />
                            ) : (
                                <ArrowDown size={24} />
                            )}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {adjustType === "IN"
                                ? "Stok Masuk (Manual)"
                                : "Stok Keluar (Manual)"}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Menyesuaikan stok untuk{" "}
                            <strong>{selectedStock?.name}</strong>.
                            <br />
                            Stok saat ini:{" "}
                            <strong>
                                {selectedStock?.qty} {selectedStock?.unit}
                            </strong>
                        </p>

                        <div>
                            <InputLabel
                                value={`Jumlah ${adjustType === "IN" ? "Masuk" : "Keluar"}`}
                            />
                            <TextInput
                                type="number"
                                className="w-full mt-1"
                                value={adjustForm.data.qty}
                                onChange={(e) =>
                                    adjustForm.setData("qty", e.target.value)
                                }
                                required
                                placeholder="0"
                                autoFocus
                            />
                            <InputError
                                message={adjustForm.errors.qty}
                                className="mt-2"
                            />
                        </div>

                        {adjustType === "OUT" && (
                            <>
                                <div>
                                    <InputLabel value="Customer (Pembeli)" />
                                    <select
                                        className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                        value={adjustForm.data.contact_id}
                                        onChange={(e) =>
                                            adjustForm.setData(
                                                "contact_id",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            -- Pilih Customer --
                                        </option>
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={adjustForm.errors.contact_id}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value="Masuk ke Akun" />
                                        <select
                                            className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                            value={adjustForm.data.account_id}
                                            onChange={(e) =>
                                                adjustForm.setData(
                                                    "account_id",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                -- Pilih Akun --
                                            </option>
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={
                                                adjustForm.errors.account_id
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Kategori Pemasukan" />
                                        <select
                                            className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                            value={adjustForm.data.category_id}
                                            onChange={(e) =>
                                                adjustForm.setData(
                                                    "category_id",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                -- Pilih Kategori --
                                            </option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={
                                                adjustForm.errors.category_id
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Total Pemasukan:
                                    </span>
                                    <span className="font-bold text-green-600 text-lg">
                                        {formatRupiah(
                                            (parseFloat(adjustForm.data.qty) ||
                                                0) *
                                                (selectedStock?.selling_price ||
                                                    0),
                                        )}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton
                            type="button"
                            onClick={() => setAdjustOpen(false)}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={adjustForm.processing}
                            className={
                                adjustType === "IN"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            }
                        >
                            {adjustType === "IN"
                                ? "Tambah Stok"
                                : "Jual Langsung"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* 4. Delete Modal */}
            <Modal
                show={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                closeable={false}
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-4">
                        Hapus Produk?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Anda yakin ingin menghapus{" "}
                        <strong>{selectedStock?.name}</strong>? Seluruh riwayat
                        mutasi stok barang ini juga akan terhapus.
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setDeleteOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <DangerButton
                            onClick={handleDelete}
                            disabled={deleteForm.processing}
                        >
                            Hapus Permanen
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
