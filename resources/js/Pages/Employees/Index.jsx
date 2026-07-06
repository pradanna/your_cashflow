import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import {
    Users,
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    UserCheck,
    Lock,
    Mail,
    User
} from "lucide-react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

export default function EmployeeIndex({ auth, employees, filters }) {
    // --- STATE ---
    const [search, setSearch] = useState(filters.search || "");
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // --- FORMS ---
    const createForm = useForm({
        name: "",
        email: "",
        password: "",
    });

    const editForm = useForm({
        name: "",
        email: "",
        password: "", // Opsional saat edit
    });

    const deleteForm = useForm({});

    // --- HANDLERS ---

    const handleSearch = (newSearch) => {
        router.get(
            route("employees.index"),
            { search: newSearch !== undefined ? newSearch : search },
            { preserveState: true, replace: true }
        );
    };

    const onSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const onSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch(search);
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route("employees.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openEdit = (employee) => {
        setSelectedEmployee(employee);
        editForm.setData({
            name: employee.name,
            email: employee.email,
            password: "", // Kosongkan
        });
        setEditOpen(true);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.put(route("employees.update", selectedEmployee.id), {
            onSuccess: () => {
                setEditOpen(false);
                editForm.reset();
            },
        });
    };

    const openDelete = (employee) => {
        setSelectedEmployee(employee);
        setDeleteOpen(true);
    };

    const handleDelete = (e) => {
        e.preventDefault();
        deleteForm.delete(route("employees.destroy", selectedEmployee.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                        <Users size={20} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Kelola Karyawan
                        </h2>
                        <p className="text-xs font-normal text-gray-500 mt-0.5">
                            Kelola akses karyawan untuk input orderan dan kelola stok barang.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Kelola Karyawan" />

            {/* --- CONTROLS BAR --- */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-2xl text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                        value={search}
                        onChange={onSearchChange}
                        onKeyDown={onSearchKeyDown}
                    />
                    {search && (
                        <button
                            onClick={() => {
                                setSearch("");
                                handleSearch("");
                            }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Add Button */}
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-2xl shadow-sm hover:shadow transition-all duration-200"
                >
                    <Plus size={20} />
                    <span>Tambah Karyawan</span>
                </button>
            </div>

            {/* --- EMPLOYEES LIST --- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Nama Karyawan
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Email Akses
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Role / Status
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Tanggal Dibuat
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users size={40} className="text-gray-300" />
                                            <p className="font-medium">Belum ada data karyawan.</p>
                                            <p className="text-xs text-gray-400">
                                                Tambahkan akun karyawan pertama Anda dengan tombol di atas.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                    {employee.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-semibold text-gray-800 text-sm">
                                                    {employee.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {employee.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                <UserCheck size={12} />
                                                Staff / Karyawan
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(employee.created_at).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(employee)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Edit Karyawan"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openDelete(employee)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Hapus Karyawan"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- CREATE MODAL --- */}
            <Modal show={isCreateOpen} onClose={() => setCreateOpen(false)} maxWidth="md">
                <form onSubmit={handleCreate} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            Tambah Akun Karyawan
                        </h3>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        {/* Name */}
                        <div>
                            <InputLabel htmlFor="create-name" value="Nama Lengkap Karyawan" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User size={16} />
                                </div>
                                <TextInput
                                    id="create-name"
                                    type="text"
                                    name="name"
                                    value={createForm.data.name}
                                    className="pl-10 block w-full text-sm"
                                    placeholder="Masukkan nama lengkap..."
                                    isFocused={true}
                                    onChange={(e) => createForm.setData("name", e.target.value)}
                                />
                            </div>
                            <InputError message={createForm.errors.name} className="mt-1" />
                        </div>

                        {/* Email */}
                        <div>
                            <InputLabel htmlFor="create-email" value="Email Akses (Untuk Login)" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={16} />
                                </div>
                                <TextInput
                                    id="create-email"
                                    type="email"
                                    name="email"
                                    value={createForm.data.email}
                                    className="pl-10 block w-full text-sm"
                                    placeholder="karyawan@toko.com"
                                    onChange={(e) => createForm.setData("email", e.target.value)}
                                />
                            </div>
                            <InputError message={createForm.errors.email} className="mt-1" />
                        </div>

                        {/* Password */}
                        <div>
                            <InputLabel htmlFor="create-password" value="Password" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={16} />
                                </div>
                                <TextInput
                                    id="create-password"
                                    type="password"
                                    name="password"
                                    value={createForm.data.password}
                                    className="pl-10 block w-full text-sm"
                                    placeholder="Masukkan password akun..."
                                    onChange={(e) => createForm.setData("password", e.target.value)}
                                />
                            </div>
                            <InputError message={createForm.errors.password} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setCreateOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={createForm.processing}>
                            Simpan Karyawan
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- EDIT MODAL --- */}
            <Modal show={isEditOpen} onClose={() => setEditOpen(false)} maxWidth="md">
                <form onSubmit={handleEdit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            Edit Data Karyawan
                        </h3>
                        <button
                            type="button"
                            onClick={() => setEditOpen(false)}
                            className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        {/* Name */}
                        <div>
                            <InputLabel htmlFor="edit-name" value="Nama Lengkap Karyawan" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User size={16} />
                                </div>
                                <TextInput
                                    id="edit-name"
                                    type="text"
                                    name="name"
                                    value={editForm.data.name}
                                    className="pl-10 block w-full text-sm"
                                    onChange={(e) => editForm.setData("name", e.target.value)}
                                />
                            </div>
                            <InputError message={editForm.errors.name} className="mt-1" />
                        </div>

                        {/* Email */}
                        <div>
                            <InputLabel htmlFor="edit-email" value="Email Akses" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={16} />
                                </div>
                                <TextInput
                                    id="edit-email"
                                    type="email"
                                    name="email"
                                    value={editForm.data.email}
                                    className="pl-10 block w-full text-sm"
                                    onChange={(e) => editForm.setData("email", e.target.value)}
                                />
                            </div>
                            <InputError message={editForm.errors.email} className="mt-1" />
                        </div>

                        {/* Password */}
                        <div>
                            <InputLabel htmlFor="edit-password" value="Password Baru (Kosongkan jika tidak diubah)" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={16} />
                                </div>
                                <TextInput
                                    id="edit-password"
                                    type="password"
                                    name="password"
                                    value={editForm.data.password}
                                    className="pl-10 block w-full text-sm"
                                    placeholder="Masukkan password baru..."
                                    onChange={(e) => editForm.setData("password", e.target.value)}
                                />
                            </div>
                            <InputError message={editForm.errors.password} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setEditOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={editForm.processing}>
                            Simpan Perubahan
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            <Modal show={isDeleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm">
                <form onSubmit={handleDelete} className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Hapus Akun Karyawan?
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Apakah Anda yakin ingin menghapus akun karyawan{" "}
                        <strong className="text-gray-800">{selectedEmployee?.name}</strong>?
                        Tindakan ini tidak dapat dibatalkan, dan karyawan tersebut tidak akan bisa login lagi ke aplikasi.
                    </p>

                    <div className="flex items-center justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setDeleteOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <DangerButton disabled={deleteForm.processing}>
                            Ya, Hapus Karyawan
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
