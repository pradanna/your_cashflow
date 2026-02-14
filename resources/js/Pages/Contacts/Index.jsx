import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    Plus,
    Search,
    Users,
    Pencil,
    Trash2,
    X,
    Building,
    UserCheck,
    ArrowRightLeft,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

export default function ContactIndex({ auth, contacts, filters }) {
    // --- STATE MANAGEMENT ---
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingContact, setDeletingContact] = useState(null);

    const [search, setSearch] = useState(filters.search || "");
    const [type, setType] = useState(filters.type || "");

    // --- FORMS (Inertia useForm) ---
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
            type: "BOTH",
            phone: "",
            address: "",
        });
    const deleteForm = useForm();

    // --- FILTERING LOGIC ---
    const handleFilter = () => {
        router.get(
            route("contacts.index"),
            { search, type },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    useEffect(() => {
        if (type !== (filters.type || "")) {
            handleFilter();
        }
    }, [type]);

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleFilter();
        }
    };

    // --- HANDLERS ---
    const openCreateModal = () => {
        setEditingContact(null);
        reset();
        clearErrors();
        setFormModalOpen(true);
    };

    const openEditModal = (contact) => {
        setEditingContact(contact);
        setData({
            name: contact.name,
            type: contact.type,
            phone: contact.phone || "",
            address: contact.address || "",
        });
        clearErrors();
        setFormModalOpen(true);
    };

    const closeFormModal = () => {
        setFormModalOpen(false);
        reset();
        setEditingContact(null);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (editingContact) {
            put(route("contacts.update", editingContact.id), {
                onSuccess: () => closeFormModal(),
            });
        } else {
            post(route("contacts.store"), {
                onSuccess: () => closeFormModal(),
            });
        }
    };

    const openDeleteModal = (contact) => {
        setDeletingContact(contact);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        deleteForm.delete(route("contacts.destroy", deletingContact.id), {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setDeletingContact(null);
            },
        });
    };

    // --- UI HELPERS ---
    const getTypeBadge = (contactType) => {
        switch (contactType) {
            case "CUSTOMER":
                return {
                    icon: <UserCheck size={12} />,
                    label: "Customer",
                    className: "bg-blue-100 text-blue-800",
                };
            case "SUPPLIER":
                return {
                    icon: <Building size={12} />,
                    label: "Supplier",
                    className: "bg-purple-100 text-purple-800",
                };
            case "BOTH":
                return {
                    icon: <ArrowRightLeft size={12} />,
                    label: "Both",
                    className: "bg-emerald-100 text-emerald-800",
                };
            default:
                return {
                    icon: null,
                    label: contactType,
                    className: "bg-gray-100 text-gray-800",
                };
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Data Kontak
                </h2>
            }
        >
            <Head title="Data Kontak" />

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
                                    placeholder="Cari nama kontak..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                            </div>
                            <select
                                className="px-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm bg-white"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="">Semua Tipe</option>
                                <option value="CUSTOMER">Customer</option>
                                <option value="SUPPLIER">Supplier</option>
                                <option value="BOTH">Keduanya</option>
                            </select>
                        </div>
                        <PrimaryButton
                            onClick={openCreateModal}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 gap-2"
                        >
                            <Plus size={16} />
                            Tambah Kontak
                        </PrimaryButton>
                    </div>

                    {/* 2. Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Nama</th>
                                        <th className="px-6 py-4">Tipe</th>
                                        <th className="px-6 py-4">Telepon</th>
                                        <th className="px-6 py-4">Alamat</th>
                                        <th className="px-6 py-4 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {contacts.data.length > 0 ? (
                                        contacts.data.map((contact) => {
                                            const badge = getTypeBadge(
                                                contact.type,
                                            );
                                            return (
                                                <tr
                                                    key={contact.id}
                                                    className="hover:bg-gray-50/50"
                                                >
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {contact.name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}
                                                        >
                                                            {badge.icon}
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {contact.phone || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                                                        {contact.address || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-1">
                                                            <button
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        contact,
                                                                    )
                                                                }
                                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                title="Edit"
                                                            >
                                                                <Pencil
                                                                    size={16}
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        contact,
                                                                    )
                                                                }
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                title="Hapus"
                                                            >
                                                                <Trash2
                                                                    size={16}
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-12 text-center text-gray-400"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Users
                                                        size={32}
                                                        className="text-gray-300"
                                                    />
                                                    <p>
                                                        Belum ada data kontak
                                                        ditemukan.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {contacts.links && contacts.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
                                <div className="flex gap-1">
                                    {contacts.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 rounded-lg text-sm ${link.active ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"} ${!link.url && "opacity-50 cursor-not-allowed"}`}
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
            </div>

            {/* --- MODAL TAMBAH --- */}
            <Modal show={isFormModalOpen} onClose={closeFormModal}>
                <form onSubmit={handleFormSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            {editingContact
                                ? "Edit Kontak"
                                : "Tambah Kontak Baru"}
                        </h2>
                        <button
                            type="button"
                            onClick={closeFormModal}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="name" value="Nama Kontak" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="mt-1 block w-full"
                                placeholder="Contoh: John Doe, PT. Maju Mundur"
                                isFocused
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="type" value="Tipe Kontak" />
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) =>
                                    setData("type", e.target.value)
                                }
                                className="mt-1 block w-full border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                            >
                                <option value="BOTH">
                                    Keduanya (Customer & Supplier)
                                </option>
                                <option value="CUSTOMER">Customer</option>
                                <option value="SUPPLIER">Supplier</option>
                            </select>
                            <InputError
                                message={errors.type}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="phone"
                                value="Nomor Telepon (Opsional)"
                            />
                            <TextInput
                                id="phone"
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                className="mt-1 block w-full"
                                placeholder="08123456789"
                            />
                            <InputError
                                message={errors.phone}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="address"
                                value="Alamat (Opsional)"
                            />
                            <textarea
                                id="address"
                                value={data.address}
                                onChange={(e) =>
                                    setData("address", e.target.value)
                                }
                                className="mt-1 block w-full border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm"
                                rows="3"
                                placeholder="Jalan Sudirman No. 123"
                            ></textarea>
                            <InputError
                                message={errors.address}
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton type="button" onClick={closeFormModal}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            className="bg-red-600 hover:bg-red-700"
                            disabled={processing}
                        >
                            {editingContact
                                ? "Simpan Perubahan"
                                : "Simpan Kontak"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL DELETE --- */}
            <Modal
                show={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-4">
                        Hapus Kontak?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Apakah Anda yakin ingin menghapus kontak{" "}
                        <strong>{deletingContact?.name}</strong>? Data yang
                        sudah dihapus tidak dapat dikembalikan.
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Batal
                        </SecondaryButton>
                        <DangerButton
                            onClick={handleDelete}
                            disabled={deleteForm.processing}
                        >
                            {deleteForm.processing
                                ? "Menghapus..."
                                : "Hapus Kontak"}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
