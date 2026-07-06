import React from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";
import { X, Plus, Trash2 } from "lucide-react";

export default function PurchaseModal({
    show,
    onClose,
    selectedOrderForModal,
    purchaseForm,
    submitPurchase,
    accounts,
    categories,
    suppliers,
    supplierItems,
    newPurchaseItem,
    setNewPurchaseItem,
    handleAddPurchaseItem,
    handleRemovePurchaseItem,
    handleSupplierItemSelect,
    formatRupiah
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="6xl" closeable={false}>
            <form onSubmit={submitPurchase} className="p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Input Biaya Modal Khusus
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Belanja ini akan otomatis terhubung ke Order:{" "}
                            <strong className="text-red-600">
                                {selectedOrderForModal?.invoice_number}
                            </strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* KIRI: Detail Pengeluaran */}
                    <div className="lg:col-span-5 space-y-4">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">
                            Info Nota Modal
                        </h3>

                        <div>
                            <InputLabel value="Supplier" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                                value={purchaseForm.data.contact_id}
                                onChange={(e) =>
                                    purchaseForm.setData(
                                        "contact_id",
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">-- Pilih Supplier --</option>
                                {suppliers.map((sup) => (
                                    <option key={sup.id} value={sup.id}>
                                        {sup.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={purchaseForm.errors.contact_id}
                                className="mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                    placeholder="INV-XXX"
                                />
                            </div>
                            <div>
                                <InputLabel value="Tanggal Transaksi" />
                                <TextInput
                                    type="date"
                                    className="w-full mt-1"
                                    value={purchaseForm.data.transaction_date}
                                    onChange={(e) =>
                                        purchaseForm.setData(
                                            "transaction_date",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Catatan (Opsional)" />
                            <textarea
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                                rows="2"
                                value={purchaseForm.data.note}
                                onChange={(e) =>
                                    purchaseForm.setData("note", e.target.value)
                                }
                            ></textarea>
                        </div>

                        <div>
                            <InputLabel value="Status Modal" />
                            <select
                                className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                                value={purchaseForm.data.status}
                                onChange={(e) =>
                                    purchaseForm.setData(
                                        "status",
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="PAID">Lunas (Cash)</option>
                                <option value="UNPAID">
                                    Hutang (Belum Lunas)
                                </option>
                            </select>
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
                                        className="w-full mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                                        value={purchaseForm.data.category_id}
                                        onChange={(e) =>
                                            purchaseForm.setData(
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
                            </div>
                        )}
                    </div>

                    {/* KANAN: Items Table */}
                    <div className="lg:col-span-7 flex flex-col h-full space-y-4">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">
                            Item Pengeluaran
                        </h3>

                        {/* Form Tambah Item Kecil */}
                        <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-4">
                                <InputLabel value="Item (Pilih/Ketik)" className="text-xs" />
                                <select
                                    className="w-full text-xs border-gray-300 rounded-md mb-1"
                                    onChange={handleSupplierItemSelect}
                                >
                                    <option value="">-- Pilih --</option>
                                    {supplierItems
                                        ?.filter(
                                            (s) =>
                                                !purchaseForm.data.contact_id ||
                                                s.contact_id == purchaseForm.data.contact_id,
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
                                <InputLabel value="Harga" className="text-xs" />
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
                                <InputLabel value="Qty" className="text-xs" />
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
                                            <th className="px-3 py-2">Item</th>
                                            <th className="px-3 py-2 text-center">Qty</th>
                                            <th className="px-3 py-2 text-right">Total</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {purchaseForm.data.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2">{item.item_name}</td>
                                                <td className="px-3 py-2 text-center">{item.qty}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {formatRupiah(item.price * item.qty)}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePurchaseItem(idx)}
                                                        className="text-red-500"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-gray-50 p-3 border-t flex justify-between items-center font-bold">
                                <span>Total Pengeluaran</span>
                                <span className="text-red-600">
                                    {formatRupiah(
                                        purchaseForm.data.items.reduce(
                                            (sum, item) => sum + item.price * item.qty,
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
                    <SecondaryButton onClick={onClose}>
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
    );
}
