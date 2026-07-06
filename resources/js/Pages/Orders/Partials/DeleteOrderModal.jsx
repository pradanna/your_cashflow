import React from "react";
import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

export default function DeleteOrderModal({ show, onClose, orderToDelete, handleDelete, processing }) {
    return (
        <Modal show={show} onClose={onClose} closeable={false}>
            <div className="p-6">
                <h2 className="text-lg font-bold text-red-600 mb-4">
                    Hapus Order?
                </h2>
                <p className="text-gray-600 mb-6">
                    Anda yakin ingin menghapus order{" "}
                    <strong>{orderToDelete?.invoice_number}</strong>? Data
                    transaksi keuangan atau piutang yang terkait juga akan
                    dihapus.
                </p>
                <div className="flex justify-end gap-3">
                    <SecondaryButton onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <DangerButton
                        onClick={handleDelete}
                        disabled={processing}
                    >
                        Hapus Permanen
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}
