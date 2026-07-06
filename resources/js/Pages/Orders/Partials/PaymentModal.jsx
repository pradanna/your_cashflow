import React from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";
import { X } from "lucide-react";

export default function PaymentModal({
    show,
    onClose,
    orderToPay,
    paymentForm,
    handlePayment,
    accounts,
    categories,
    formatRupiah
}) {
    return (
        <Modal show={show} onClose={onClose} closeable={false} maxWidth="md">
            <form onSubmit={handlePayment} className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        Input Pembayaran
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
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
                    <SecondaryButton onClick={onClose}>
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
    );
}
