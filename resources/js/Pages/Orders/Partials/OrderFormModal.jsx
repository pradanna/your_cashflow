import React from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";
import Select from "react-select";
import { X, Plus, FileText, ShoppingBag } from "lucide-react";

export default function OrderFormModal({
    show,
    onClose,
    isOwner,
    editingOrder,
    handleSubmitOrder,
    data,
    setData,
    errors,
    processing,
    contactOptions,
    contacts,
    items,
    accounts,
    categories,
    suppliers,
    setAddItemOpen,
    handleRemoveItem,
    handleRemoveLinkedPurchase,
    grandTotal,
    formatRupiah
}) {
    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth="5xl"
            closeable={false}
        >
            <form onSubmit={handleSubmitOrder} className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {editingOrder ? "Edit Order" : "Buat Order Baru"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* KIRI: Informasi Order */}
                    <div className="space-y-5">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">
                            Informasi Transaksi
                        </h3>

                        <div>
                            <InputLabel value="Pelanggan" />
                            <Select
                                className="mt-1"
                                classNamePrefix="react-select"
                                options={contactOptions}
                                value={contactOptions.find(
                                    (opt) => opt.value === data.contact_id,
                                )}
                                onChange={(selectedOption) => {
                                    const contactId = selectedOption ? selectedOption.value : "";
                                    
                                    // Cari tau apakah kontak baru adalah employee
                                    const selectedContact = contacts.find(c => c.id == contactId);
                                    const isEmployee = selectedContact && selectedContact.type === 'EMPLOYEE';
                                    
                                    // Update harga item yang sudah ada di list sesuai tipe kontak
                                    const updatedItems = data.items.map(item => {
                                        const catalogItem = items.find(i => String(i.id) === String(item.item_id));
                                        if (catalogItem) {
                                            const priceToUse = isEmployee && parseFloat(catalogItem.purchase_price) > 0 
                                                ? catalogItem.purchase_price 
                                                : catalogItem.price;
                                            return {
                                                ...item,
                                                price: priceToUse
                                            };
                                        }
                                        return item;
                                    });

                                    setData({
                                        ...data,
                                        contact_id: contactId,
                                        items: updatedItems,
                                        status: "UNPAID"
                                    });
                                }}
                                placeholder="-- Pilih Pelanggan --"
                                isClearable
                                isSearchable
                            />
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
                                Nomor invoice akan digenerate otomatis oleh sistem.
                            </p>
                        </div>

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

                    {/* KANAN: Item Penjualan & Total Ringkasan */}
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col flex-1">
                            <div className="flex justify-between items-center border-b pb-2 mb-3">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <FileText size={16} /> Item Penjualan
                                </h3>
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setAddItemOpen(true)}
                                    size="sm"
                                    className="gap-2 text-xs"
                                >
                                    <Plus size={14} /> Item
                                </SecondaryButton>
                            </div>

                            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-2">Item</th>
                                            <th className="px-4 py-2 text-center w-16">
                                                Qty
                                            </th>
                                            <th className="px-4 py-2 text-right">
                                                Total
                                            </th>
                                            <th className="px-4 py-2 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {data.items.length > 0 ? (
                                            data.items.map((item, index) => (
                                                <tr key={index} className="bg-white">
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium text-gray-900 leading-tight">
                                                            {item.item_name}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-1">
                                                            @ {formatRupiah(item.price)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {item.qty}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-medium">
                                                        {formatRupiah(item.price * item.qty)}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-6 text-center text-gray-400 text-xs italic">
                                                    Belum ada item jual.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* RINGKASAN AKHIR KARYAWAN */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Total Penjualan</span>
                                <span className="font-bold text-gray-900 text-lg">
                                    {formatRupiah(grandTotal)}
                                </span>
                            </div>
                        </div>
                        
                        <InputError message={errors.items} className="mt-2" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
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
    );
}
