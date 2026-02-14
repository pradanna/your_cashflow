import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import {
    Plus,
    Search,
    Package,
    ShoppingBag,
    X,
    Pencil,
    Trash2,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import { formatRupiah } from "@/Utils/format";

export default function CatalogIndex({
    auth,
    items,
    supplierItems,
    suppliers,
    filters,
}) {
    const [activeTab, setActiveTab] = useState(filters.tab || "items");
    const [isModalOpen, setModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    // State untuk filter
    const [search, setSearch] = useState(filters.search || "");
    const [supplierFilter, setSupplierFilter] = useState(
        filters.supplier_id || "",
    );

    // Form Handling (Inertia useForm)
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
        name: "",
        price: "",
        unit: "",
        is_stock_active: true,
        supplier_id: "", // Khusus supplier_items
    });

    // Handle Filter Trigger
    const handleFilter = () => {
        router.get(
            route("catalogs.index"),
            {
                tab: activeTab,
                search: search,
                supplier_id:
                    activeTab === "supplier_items" ? supplierFilter : undefined,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    useEffect(() => {
        // Auto-filter when supplier dropdown changes
        if (supplierFilter !== (filters.supplier_id || "")) {
            handleFilter();
        }
    }, [supplierFilter]);

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleFilter();
        }
    };

    // Handle Tab Change
    const switchTab = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        // Reset filters when switching tabs
        setSearch("");
        setSupplierFilter("");
        router.get(
            route("catalogs.index"),
            { tab: tab },
            { preserveState: true, replace: true },
        );
    };

    // Handle Submit Modal
    const handleSubmit = (e) => {
        e.preventDefault();

        const options = {
            onSuccess: () => closeModal(),
            preserveScroll: true,
        };

        if (isEditMode && selectedItem) {
            if (activeTab === "items") {
                put(route("items.update", selectedItem.id), options);
            } else {
                put(route("supplier-items.update", selectedItem.id), options);
            }
        } else {
            if (activeTab === "items") {
                post(route("items.store_custom"), options);
            } else {
                post(route("supplier-items.store_custom"), options);
            }
        }
    };

    // Handle Delete
    const handleDelete = () => {
        const options = {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setSelectedItem(null);
            },
            preserveScroll: true,
        };

        if (activeTab === "items") {
            destroy(route("items.destroy", selectedItem.id), options);
        } else {
            destroy(route("supplier-items.destroy", selectedItem.id), options);
        }
    };

    // --- MODAL & FORM HANDLERS ---
    const openModal = () => {
        setIsEditMode(false);
        setSelectedItem(null);
        reset();
        clearErrors();
        // Pre-fill supplier if only one exists for convenience
        if (activeTab === "supplier_items" && suppliers.length === 1) {
            setData("supplier_id", suppliers[0].id);
        }
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setIsEditMode(true);
        setSelectedItem(item);
        clearErrors();
        setData({
            name: item.name,
            price: item.price,
            unit: item.unit,
            is_stock_active: item.is_stock_active ?? true,
            supplier_id: item.contact_id || item.supplier_id || "", // Adjust based on model
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedItem(null);
    };

    // --- UI HELPERS ---
    const renderTableContent = () => {
        const dataSet = activeTab === "items" ? items : supplierItems;

        if (dataSet.data.length === 0) {
            return (
                <tr>
                    <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-gray-400"
                    >
                        <div className="flex flex-col items-center gap-2">
                            {activeTab === "items" ? (
                                <Package size={32} className="text-gray-300" />
                            ) : (
                                <ShoppingBag
                                    size={32}
                                    className="text-gray-300"
                                />
                            )}
                            <p>
                                Belum ada data{" "}
                                {activeTab === "items"
                                    ? "item penjualan"
                                    : "item supplier"}{" "}
                                ditemukan.
                            </p>
                        </div>
                    </td>
                </tr>
            );
        }

        return dataSet.data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                </td>
                {activeTab === "items" ? (
                    <>
                        <td className="px-6 py-4 text-gray-600">
                            {formatRupiah(item.price)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{item.unit}</td>
                        <td className="px-6 py-4">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    item.is_stock_active
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                                {item.is_stock_active ? "Stok" : "Jasa"}
                            </span>
                        </td>
                    </>
                ) : (
                    <>
                        <td className="px-6 py-4 text-gray-600">
                            {item.supplier?.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                            {formatRupiah(item.price)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{item.unit}</td>
                    </>
                )}
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                        <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onClick={() => {
                                setSelectedItem(item);
                                setDeleteModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Hapus"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
            </tr>
        ));
    };

    const currentPagination = activeTab === "items" ? items : supplierItems;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Katalog
                </h2>
            }
        >
            <Head title="Katalog" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* 1. Action Bar & Filters */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex gap-2 flex-1">
                            <div className="relative w-full max-w-xs">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Cari nama item..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                            </div>
                            {activeTab === "supplier_items" && (
                                <select
                                    className="px-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm bg-white"
                                    value={supplierFilter}
                                    onChange={(e) =>
                                        setSupplierFilter(e.target.value)
                                    }
                                >
                                    <option value="">Semua Supplier</option>
                                    {suppliers.map((sup) => (
                                        <option key={sup.id} value={sup.id}>
                                            {sup.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <PrimaryButton
                            onClick={openModal}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 gap-2"
                        >
                            <Plus size={16} />
                            Tambah{" "}
                            {activeTab === "items"
                                ? "Item Jual"
                                : "Item Supplier"}
                        </PrimaryButton>
                    </div>

                    {/* 2. Table with Tabs */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex">
                                <button
                                    onClick={() => switchTab("items")}
                                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === "items"
                                            ? "border-red-500 text-red-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                                    }`}
                                >
                                    Item Penjualan
                                </button>
                                <button
                                    onClick={() => switchTab("supplier_items")}
                                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === "supplier_items"
                                            ? "border-red-500 text-red-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                                    }`}
                                >
                                    Item Supplier
                                </button>
                            </nav>
                        </div>

                        {/* Content Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Nama</th>
                                        {activeTab === "items" ? (
                                            <>
                                                <th className="px-6 py-4">
                                                    Harga Jual
                                                </th>
                                                <th className="px-6 py-4">
                                                    Unit
                                                </th>
                                                <th className="px-6 py-4">
                                                    Tipe
                                                </th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-4">
                                                    Supplier
                                                </th>
                                                <th className="px-6 py-4">
                                                    Harga Beli
                                                </th>
                                                <th className="px-6 py-4">
                                                    Unit
                                                </th>
                                            </>
                                        )}
                                        <th className="px-6 py-4 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {renderTableContent()}
                                </tbody>
                            </table>
                        </div>
                        {currentPagination.links &&
                            currentPagination.links.length > 3 && (
                                <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
                                    <div className="flex gap-1">
                                        {currentPagination.links.map(
                                            (link, i) => (
                                                <Link
                                                    key={i}
                                                    href={link.url || "#"}
                                                    className={`px-3 py-1 rounded-lg text-sm ${
                                                        link.active
                                                            ? "bg-red-600 text-white"
                                                            : "text-gray-600 hover:bg-gray-100"
                                                    } ${
                                                        !link.url &&
                                                        "opacity-50 cursor-not-allowed"
                                                    }`}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Data */}
            <Modal show={isModalOpen} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            {isEditMode ? "Edit" : "Tambah"}{" "}
                            {activeTab === "items"
                                ? "Item Penjualan"
                                : "Item Supplier"}
                        </h2>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {/* Field Nama (Shared) */}
                        <div>
                            <InputLabel htmlFor="name" value="Nama Item" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="mt-1 block w-full"
                                placeholder="Contoh: Jasa Desain Logo"
                                isFocused
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>

                        {/* Field Khusus Items */}
                        {activeTab === "items" && (
                            <>
                                <div>
                                    <InputLabel
                                        htmlFor="price"
                                        value="Harga Jual"
                                    />
                                    <TextInput
                                        id="price"
                                        type="number"
                                        value={data.price}
                                        onChange={(e) =>
                                            setData("price", e.target.value)
                                        }
                                        className="mt-1 block w-full"
                                        placeholder="150000"
                                        required
                                    />
                                    <InputError
                                        message={errors.price}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="unit" value="Unit" />
                                    <TextInput
                                        id="unit"
                                        value={data.unit}
                                        onChange={(e) =>
                                            setData("unit", e.target.value)
                                        }
                                        className="mt-1 block w-full"
                                        placeholder="pcs, jam, paket"
                                        required
                                    />
                                    <InputError
                                        message={errors.unit}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="is_stock_active"
                                        value="Tipe Item"
                                    />
                                    <select
                                        id="is_stock_active"
                                        value={data.is_stock_active}
                                        onChange={(e) =>
                                            setData(
                                                "is_stock_active",
                                                e.target.value === "true",
                                            )
                                        }
                                        className="mt-1 block w-full border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                    >
                                        <option value={true}>
                                            Barang Stok
                                        </option>
                                        <option value={false}>Jasa</option>
                                    </select>
                                    <InputError
                                        message={errors.is_stock_active}
                                        className="mt-2"
                                    />
                                </div>
                            </>
                        )}

                        {/* Field Khusus Supplier Items */}
                        {activeTab === "supplier_items" && (
                            <>
                                <div>
                                    <InputLabel
                                        htmlFor="supplier_id"
                                        value="Supplier"
                                    />
                                    <select
                                        id="supplier_id"
                                        value={data.supplier_id}
                                        onChange={(e) =>
                                            setData(
                                                "supplier_id",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                        required
                                    >
                                        <option value="">Pilih Supplier</option>
                                        {suppliers.map((sup) => (
                                            <option key={sup.id} value={sup.id}>
                                                {sup.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.supplier_id}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="price"
                                        value="Harga Beli"
                                    />
                                    <TextInput
                                        id="price"
                                        type="number"
                                        value={data.price}
                                        onChange={(e) =>
                                            setData("price", e.target.value)
                                        }
                                        className="mt-1 block w-full"
                                        placeholder="100000"
                                        required
                                    />
                                    <InputError
                                        message={errors.price}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="unit" value="Unit" />
                                    <TextInput
                                        id="unit"
                                        value={data.unit}
                                        onChange={(e) =>
                                            setData("unit", e.target.value)
                                        }
                                        className="mt-1 block w-full"
                                        placeholder="kg, rim, box"
                                        required
                                    />
                                    <InputError
                                        message={errors.unit}
                                        className="mt-2"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton type="button" onClick={closeModal}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            className="bg-red-600 hover:bg-red-700"
                            disabled={processing}
                        >
                            {isEditMode ? "Simpan Perubahan" : "Simpan"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Delete */}
            <Modal
                show={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-4">
                        Hapus Item?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Anda yakin ingin menghapus item{" "}
                        <strong>{selectedItem?.name}</strong>? Tindakan ini
                        tidak dapat dibatalkan.
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Batal
                        </SecondaryButton>
                        <DangerButton
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            {processing ? "Menghapus..." : "Hapus Permanen"}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
