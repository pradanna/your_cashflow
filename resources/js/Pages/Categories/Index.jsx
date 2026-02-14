import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import {
    Tags,
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Filter,
    ArrowUpCircle,
    ArrowDownCircle,
} from "lucide-react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

export default function CategoryIndex({ auth, categories, filters }) {
    // --- STATE ---
    const [search, setSearch] = useState(filters.search || "");
    const [typeFilter, setTypeFilter] = useState(filters.type || "");

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // --- FORMS ---
    const createForm = useForm({
        name: "",
        type: "EXPENSE", // Default to Expense
    });

    const editForm = useForm({
        name: "",
        type: "",
    });

    const deleteForm = useForm({});

    // --- HANDLERS ---

    // Search & Filter Trigger
    const handleSearch = (newSearch, newType) => {
        router.get(
            route("categories.index"),
            {
                search: newSearch !== undefined ? newSearch : search,
                type: newType !== undefined ? newType : typeFilter,
            },
            { preserveState: true, replace: true },
        );
    };

    const onSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const onSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch(search, typeFilter);
        }
    };

    const onTypeFilterChange = (e) => {
        const val = e.target.value;
        setTypeFilter(val);
        handleSearch(search, val);
    };

    // Create
    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route("categories.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    // Edit
    const openEdit = (category) => {
        setSelectedCategory(category);
        editForm.setData({
            name: category.name,
            type: category.type,
        });
        setEditOpen(true);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.put(route("categories.update", selectedCategory.id), {
            onSuccess: () => setEditOpen(false),
        });
    };

    // Delete
    const openDelete = (category) => {
        setSelectedCategory(category);
        setDeleteOpen(true);
    };

    const handleDelete = (e) => {
        e.preventDefault();
        deleteForm.delete(route("categories.destroy", selectedCategory.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Kategori Transaksi
                </h2>
            }
        >
            <Head title="Kategori" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* TOOLBAR: Search, Filter, Add */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Cari kategori..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm"
                                    value={search}
                                    onChange={onSearchChange}
                                    onKeyDown={onSearchKeyDown}
                                />
                            </div>

                            {/* Type Filter */}
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Filter size={16} />
                                </div>
                                <select
                                    className="pl-9 pr-8 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm appearance-none bg-white cursor-pointer"
                                    value={typeFilter}
                                    onChange={onTypeFilterChange}
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="INCOME">Pemasukan</option>
                                    <option value="EXPENSE">Pengeluaran</option>
                                </select>
                            </div>
                        </div>

                        <PrimaryButton
                            onClick={() => setCreateOpen(true)}
                            className="bg-red-600 hover:bg-red-700 gap-2 justify-center"
                        >
                            <Plus size={16} />
                            Tambah Kategori
                        </PrimaryButton>
                    </div>

                    {/* TABLE */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Nama Kategori</th>
                                    <th className="px-6 py-4">Tipe</th>
                                    <th className="px-6 py-4 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {categories.data.length > 0 ? (
                                    categories.data.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-gray-50/50"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {category.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        category.type ===
                                                        "INCOME"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {category.type ===
                                                    "INCOME" ? (
                                                        <ArrowUpCircle
                                                            size={14}
                                                        />
                                                    ) : (
                                                        <ArrowDownCircle
                                                            size={14}
                                                        />
                                                    )}
                                                    {category.type === "INCOME"
                                                        ? "Pemasukan"
                                                        : "Pengeluaran"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openEdit(category)
                                                        }
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            openDelete(category)
                                                        }
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                                            colSpan="3"
                                            className="px-6 py-12 text-center text-gray-400"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Tags
                                                    size={32}
                                                    className="text-gray-300"
                                                />
                                                <p>
                                                    Tidak ada kategori
                                                    ditemukan.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination (Simple) */}
                    {categories.links && categories.links.length > 3 && (
                        <div className="flex justify-center mt-4">
                            {/* Implementasi pagination component jika diperlukan,
                                atau gunakan simple prev/next button logic */}
                        </div>
                    )}
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
                            Tambah Kategori
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
                            <InputLabel value="Nama Kategori" />
                            <TextInput
                                className="w-full mt-1"
                                value={createForm.data.name}
                                onChange={(e) =>
                                    createForm.setData("name", e.target.value)
                                }
                                required
                                placeholder="Contoh: Gaji, Listrik, Makan Siang"
                                autoFocus
                            />
                            <InputError
                                message={createForm.errors.name}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel value="Tipe Transaksi" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                value={createForm.data.type}
                                onChange={(e) =>
                                    createForm.setData("type", e.target.value)
                                }
                            >
                                <option value="EXPENSE">
                                    Pengeluaran (Expense)
                                </option>
                                <option value="INCOME">
                                    Pemasukan (Income)
                                </option>
                            </select>
                            <InputError
                                message={createForm.errors.type}
                                className="mt-2"
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
                        Edit Kategori
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Nama Kategori" />
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
                        <div>
                            <InputLabel value="Tipe Transaksi" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                value={editForm.data.type}
                                onChange={(e) =>
                                    editForm.setData("type", e.target.value)
                                }
                            >
                                <option value="EXPENSE">
                                    Pengeluaran (Expense)
                                </option>
                                <option value="INCOME">
                                    Pemasukan (Income)
                                </option>
                            </select>
                            <InputError
                                message={editForm.errors.type}
                                className="mt-2"
                            />
                        </div>
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

            {/* 3. Delete Modal */}
            <Modal
                show={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                closeable={false}
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-4">
                        Hapus Kategori?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Anda yakin ingin menghapus kategori{" "}
                        <strong>{selectedCategory?.name}</strong>?
                        <br />
                        <span className="text-xs text-gray-500 italic">
                            Pastikan kategori ini tidak sedang digunakan di
                            transaksi aktif.
                        </span>
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
