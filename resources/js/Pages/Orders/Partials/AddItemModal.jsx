import React, { useState } from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";
import Select from "react-select";
import { ShoppingBag } from "lucide-react";

export default function AddItemModal({
    show,
    onClose,
    items,
    suppliers,
    newItem,
    setNewItem,
    handleItemSelect,
    handleAddItem,
    formatRupiah,
    isOwner
}) {
    const [selectedSupplierId, setSelectedSupplierId] = useState("");

    const filteredItems = selectedSupplierId
        ? items.filter(
              (item) =>
                  item.contact_id == selectedSupplierId ||
                  item.supplier_id == selectedSupplierId
          )
        : items;

    const handleClose = () => {
        setSelectedSupplierId("");
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="md" closeable={false}>
            <form onSubmit={handleAddItem} className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Tambah Item
                </h3>
                <div className="space-y-4">
                    <div>
                        <InputLabel value="Pilih Supplier" />
                        <Select
                            className="mt-1"
                            classNamePrefix="react-select"
                            options={suppliers.map((s) => ({
                                value: s.id,
                                label: s.name,
                            }))}
                            value={
                                suppliers
                                    .map((s) => ({ value: s.id, label: s.name }))
                                    .find((opt) => opt.value == selectedSupplierId) || null
                            }
                            onChange={(opt) => {
                                setSelectedSupplierId(opt ? opt.value : "");
                                // Reset item selection when supplier changes
                                handleItemSelect(null);
                            }}
                            placeholder="-- Pilih Supplier (Opsional) --"
                            isClearable
                            isSearchable
                        />
                    </div>

                    <div>
                        <InputLabel value="Pilih Item (Katalog)" />
                        <Select
                            className="mt-1"
                            classNamePrefix="react-select"
                            options={filteredItems.map((item) => ({
                                value: item.id,
                                label: `${item.name} (${formatRupiah(item.price)})`,
                            }))}
                            value={
                                filteredItems
                                    .map((item) => ({
                                        value: item.id,
                                        label: `${item.name} (${formatRupiah(item.price)})`,
                                    }))
                                    .find((opt) => opt.value == newItem.item_id) || null
                            }
                            onChange={handleItemSelect}
                            placeholder="-- Pilih Item --"
                            isClearable
                            isSearchable
                        />
                    </div>

                    {newItem.unit === "meteran" && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <div>
                                <InputLabel value="Panjang (m)" className="text-blue-700" />
                                <TextInput
                                    type="number"
                                    step="0.01"
                                    className="w-full mt-1"
                                    value={newItem.length}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            length: e.target.value,
                                        })
                                    }
                                    placeholder="1"
                                />
                            </div>
                            <div>
                                <InputLabel value="Lebar (m)" className="text-blue-700" />
                                <TextInput
                                    type="number"
                                    step="0.01"
                                    className="w-full mt-1"
                                    value={newItem.width}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            width: e.target.value,
                                        })
                                    }
                                    placeholder="1"
                                />
                            </div>
                            <div className="col-span-2 text-[10px] text-blue-500 italic">
                                * Luas: {parseFloat(newItem.length || 0) * parseFloat(newItem.width || 0)} m²
                            </div>
                        </div>
                    )}

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

                    {/* Background calculations for Linked Purchase will run based on catalog items. */}
                    {isOwner && (
                        <div className="grid grid-cols-2 gap-4 border-t border-dashed pt-4 mt-2">
                            <div className="col-span-2">
                                <InputLabel value="Supplier (Untuk Pengeluaran/HPP)" />
                                <Select
                                    className="mt-1"
                                    classNamePrefix="react-select"
                                    options={suppliers.map((s) => ({
                                        value: s.id,
                                        label: s.name,
                                    }))}
                                    value={
                                        suppliers
                                            .map((s) => ({ value: s.id, label: s.name }))
                                            .find((opt) => opt.value == newItem.supplier_id) || null
                                    }
                                    onChange={(opt) =>
                                        setNewItem({
                                            ...newItem,
                                            supplier_id: opt ? String(opt.value) : "",
                                        })
                                    }
                                    placeholder="-- Pilih Supplier --"
                                    isClearable
                                    isSearchable
                                />
                            </div>
                            <div className="col-span-2">
                                <InputLabel value="Harga Beli Satuan (HPP)" />
                                <TextInput
                                    type="number"
                                    className="w-full mt-1"
                                    value={newItem.purchase_price}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            purchase_price: e.target.value,
                                        })
                                    }
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-2 text-right">
                        <p className="text-sm text-gray-500">
                            Subtotal Jual:{" "}
                            <span className="font-bold text-red-600">
                                {formatRupiah(newItem.price * newItem.qty)}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <SecondaryButton type="button" onClick={handleClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton type="submit" className="bg-red-600 hover:bg-red-700">
                        Tambah ke List
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
