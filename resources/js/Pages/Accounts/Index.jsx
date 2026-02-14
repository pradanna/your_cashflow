import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import { Wallet, Plus, Pencil, Trash2, CreditCard, X } from "lucide-react";
import Card from "@/Components/UI/Card";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

// Helper format rupiah (jika belum ada, buat di resources/js/Utils/format.js)
import { formatRupiah } from "@/Utils/format";

export default function AccountIndex({ auth, accounts, totalBalance }) {
    // --- STATE MANAGEMENT ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // --- FORMS (Inertia useForm) ---
    const createForm = useForm({ name: "", initial_balance: "" });
    const editForm = useForm({ name: "" });
    const deleteForm = useForm({});

    // --- HANDLERS ---
    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route("accounts.store"), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openEdit = (account) => {
        setSelectedAccount(account);
        editForm.setData("name", account.name);
        setIsEditOpen(true);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.put(route("accounts.update", selectedAccount.id), {
            onSuccess: () => setIsEditOpen(false),
        });
    };

    const openDelete = (account) => {
        setSelectedAccount(account);
        setIsDeleteOpen(true);
    };

    const handleDelete = (e) => {
        e.preventDefault();
        deleteForm.delete(route("accounts.destroy", selectedAccount.id), {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Manajemen Akun
                    </h2>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Total Aset:{" "}
                        <span className="font-bold text-gray-800">
                            {formatRupiah(totalBalance)}
                        </span>
                    </span>
                </div>
            }
        >
            <Head title="Manajemen Akun" />

            {/* --- CONTENT AREA --- */}
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* 1. Action Bar */}
                    <div className="flex justify-end">
                        <PrimaryButton
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 gap-2"
                        >
                            <Plus size={16} />
                            Tambah Akun
                        </PrimaryButton>
                    </div>

                    {/* 2. Grid Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Loop Data Akun */}
                        {accounts.map((account) => (
                            <Card
                                key={account.id}
                                className="relative group hover:border-red-200 transition-all duration-200"
                            >
                                {/* Header Card */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                                        <Wallet size={24} />
                                    </div>

                                    {/* Action Buttons (Hover Only) */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => openEdit(account)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Nama"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => openDelete(account)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus Akun"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div>
                                    <h3
                                        className="text-lg font-semibold text-gray-700 truncate"
                                        title={account.name}
                                    >
                                        {account.name}
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {formatRupiah(account.balance)}
                                    </p>
                                </div>

                                {/* Footer Card */}
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                    <span>ID: #{account.id}</span>
                                    <span>
                                        Last Update:{" "}
                                        {new Date(
                                            account.updated_at,
                                        ).toLocaleDateString("id-ID")}
                                    </span>
                                </div>
                            </Card>
                        ))}

                        {/* Empty State (Jika belum ada data) */}
                        {accounts.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                                <CreditCard
                                    size={48}
                                    className="mb-4 opacity-50"
                                />
                                <p className="font-medium">
                                    Belum ada akun tersimpan
                                </p>
                                <p className="text-sm">
                                    Mulai dengan menambahkan dompet atau
                                    rekening bank.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Modal Tambah */}
            <Modal
                show={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                closeable={false}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            Tambah Akun Baru
                        </h2>
                        <button
                            onClick={() => setIsCreateOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="name" value="Nama Akun" />
                            <TextInput
                                id="name"
                                value={createForm.data.name}
                                onChange={(e) =>
                                    createForm.setData("name", e.target.value)
                                }
                                className="mt-1 block w-full"
                                placeholder="Contoh: BCA Utama, Kas Toko, OVO"
                                isFocused
                            />
                            <InputError
                                message={createForm.errors.name}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="initial_balance"
                                value="Saldo Awal (Rp)"
                            />
                            <TextInput
                                id="initial_balance"
                                type="number"
                                value={createForm.data.initial_balance}
                                onChange={(e) =>
                                    createForm.setData(
                                        "initial_balance",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 block w-full"
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                *Saldo awal akan dicatat otomatis sebagai
                                Transaksi Masuk.
                            </p>
                            <InputError
                                message={createForm.errors.initial_balance}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <SecondaryButton
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Batal
                            </SecondaryButton>
                            <PrimaryButton
                                className="bg-red-600 hover:bg-red-700"
                                disabled={createForm.processing}
                            >
                                Simpan Akun
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* 2. Modal Edit */}
            <Modal
                show={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                closeable={false}
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Edit Nama Akun
                    </h2>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="edit_name" value="Nama Akun" />
                            <TextInput
                                id="edit_name"
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData("name", e.target.value)
                                }
                                className="mt-1 block w-full"
                            />
                            <InputError
                                message={editForm.errors.name}
                                className="mt-2"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <SecondaryButton
                                onClick={() => setIsEditOpen(false)}
                            >
                                Batal
                            </SecondaryButton>
                            <PrimaryButton
                                className="bg-red-600 hover:bg-red-700"
                                disabled={editForm.processing}
                            >
                                Simpan Perubahan
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* 3. Modal Hapus */}
            <Modal
                show={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                closeable={false}
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold  text-red-600">
                        Hapus Akun?
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Anda akan menghapus akun{" "}
                        <strong>{selectedAccount?.name}</strong>. Seluruh
                        riwayat transaksi yang terkait dengan akun ini juga akan
                        terhapus. Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setIsDeleteOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <DangerButton
                            onClick={handleDelete}
                            disabled={deleteForm.processing}
                        >
                            Ya, Hapus Permanen
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
