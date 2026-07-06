// c:\PROJECT\WEBSITE\your_cashflow\resources\js\Pages\Orders\Index.jsx

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
    Plus,
    Search,
    Filter,
    Eye,
    Calendar,
    FileText,
    X,
    Pencil,
    Trash2,
    Wallet,
    ShoppingBag,
} from "lucide-react";
import { formatRupiah } from "@/Utils/format";
import { getStatusBadge } from "@/Utils/badge";
import OrderFormModal from "./Partials/OrderFormModal";
import AddItemModal from "./Partials/AddItemModal";
import PurchaseModal from "./Partials/PurchaseModal";
import DeleteOrderModal from "./Partials/DeleteOrderModal";
import PaymentModal from "./Partials/PaymentModal";

export default function OrderIndex({
    orders,
    filters,
    contacts,
    items,
    accounts,
    categories,
    suppliers,
    stocks,
    supplierItems,
}) {
    const { props } = usePage();
    const isOwner = props.auth?.user?.role !== "karyawan";

    // State untuk filter
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [dateStart, setDateStart] = useState(
        filters.date_start || new Date().toISOString().split("T")[0],
    );
    const [dateEnd, setDateEnd] = useState(
        filters.date_end || new Date().toISOString().split("T")[0],
    );

    // State Modal
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isAddItemOpen, setAddItemOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isPaymentOpen, setPaymentOpen] = useState(false);
    const [isPurchaseOpen, setPurchaseOpen] = useState(false);

    const [editingOrder, setEditingOrder] = useState(null);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [orderToPay, setOrderToPay] = useState(null);
    const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

    // Form Order
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
        contact_id: "",
        transaction_date: new Date().toISOString().split("T")[0],
        status: "UNPAID",
        note: "",
        account_id: "",
        category_id: "",
        items: [],
        linked_purchases: [], // Baru: Modal per Nota
    });

    // Form Payment
    const paymentForm = useForm({
        account_id: "",
        category_id: "",
        transaction_date: new Date().toISOString().split("T")[0],
        amount: "",
        note: "",
    });

    // Form Purchase (Modal)
    const purchaseForm = useForm({
        order_id: "",
        contact_id: "",
        reference_number: "",
        transaction_date: new Date().toISOString().split("T")[0],
        status: "UNPAID",
        note: "",
        account_id: "",
        category_id: "",
        items: [],
    });

    // State Temporary Item Purchase
    const [newPurchaseItem, setNewPurchaseItem] = useState({
        item_name: "",
        price: "",
        qty: 1,
    });

    const [newItem, setNewItem] = useState({
        item_id: "",
        item_name: "",
        price: "",
        base_price: "", // Harga dasar jual dari katalog
        purchase_price: "",
        base_purchase_price: "", // Harga dasar modal dari katalog
        supplier_id: "",
        qty: 1,
        unit: "",
        length: 1,
        width: 1,
        purchase_status: "UNPAID",
        purchase_amount: 0,
    });

    const isInitialMount = React.useRef(true);

    // Effect untuk hitung harga meteran otomatis
    useEffect(() => {
        if (newItem.unit === "meteran") {
            const area = parseFloat(newItem.length || 0) * parseFloat(newItem.width || 0);
            
            setNewItem(prev => ({
                ...prev,
                price: area * parseFloat(newItem.base_price || 0),
                purchase_price: area * parseFloat(newItem.base_purchase_price || 0)
            }));
        }
    }, [newItem.length, newItem.width, newItem.base_price, newItem.base_purchase_price, newItem.unit]);

    // Effect untuk hitung total harga modal otomatis saat harga satuan atau qty berubah
    useEffect(() => {
        setNewItem(prev => ({
            ...prev,
            purchase_amount: parseFloat(prev.purchase_price || 0) * parseFloat(prev.qty || 1)
        }));
    }, [newItem.purchase_price, newItem.qty]);

    // Debounce search / auto-submit filter
    useEffect(() => {
        // Mencegah effect berjalan pada saat mount pertama kali.
        // Ini akan menghentikan reset pagination saat berpindah halaman.
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                route("orders.index"),
                {
                    search,
                    status,
                    date_start: dateStart,
                    date_end: dateEnd,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300); // Debounce 300ms

        return () => clearTimeout(timer);
    }, [search, status, dateStart, dateEnd]);

    // --- HANDLERS CREATE ORDER ---

    const openCreateModal = () => {
        setEditingOrder(null);
        reset();
        setCreateOpen(true);
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        setData({
            contact_id: order.contact_id || "",
            transaction_date: order.transaction_date ? order.transaction_date.split('T')[0] : '',
            status: order.status,
            note: order.note || "",
            // Ambil account/category dari relasi transaction jika ada (dan status PAID)
            account_id: order.transaction?.account_id || "",
            category_id: order.transaction?.category_id || "",
            items: order.items.map((item) => ({
                item_id: item.item_id,
                item_name: item.item_name,
                qty: parseFloat(item.qty),
                price: parseFloat(item.price),
            })),
            linked_purchases: order.purchases
                ? order.purchases.map((p) => ({
                      item_name: p.items?.[0]?.item_name || p.note,
                      supplier_id: p.contact_id || "",
                      qty: p.items?.[0]?.qty || 1,
                      amount: p.grand_total,
                      status: p.status,
                  }))
                : [],
        });
        setCreateOpen(true);
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.item_name || !newItem.price || !newItem.qty) return;

        let finalItemName = newItem.item_name;
        if (newItem.unit === "meteran") {
            finalItemName += ` (${newItem.length}x${newItem.width})`;
        }

        const itemToAdd = {
            ...newItem,
            item_name: finalItemName,
            qty: parseFloat(newItem.qty),
            price: parseFloat(newItem.price),
        };

        setData({
            ...data,
            items: [...data.items, itemToAdd],
            linked_purchases:
                newItem.purchase_price > 0
                    ? [
                          ...data.linked_purchases,
                          {
                              item_name: newItem.item_name,
                              supplier_id: newItem.supplier_id || "",
                              qty: newItem.qty,
                              amount: newItem.purchase_amount || (newItem.purchase_price * newItem.qty),
                              status: "UNPAID",
                          },
                      ]
                    : data.linked_purchases,
        });

        setAddItemOpen(false);
        // Reset new item form
        setNewItem({
            item_id: "",
            item_name: "",
            price: "",
            base_price: "",
            purchase_price: "",
            base_purchase_price: "",
            supplier_id: "",
            qty: 1,
            unit: "",
            length: 1,
            width: 1,
            purchase_status: "UNPAID",
            purchase_amount: 0,
        });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = [...data.items];
        // Jika item ini punya linked purchase (berdasarkan index atau nama? biasanya nama/index 1:1 jika ditambah bersamaan)
        // Namun lebih aman jika kita biarkan user hapus terpisah atau hapus item menghapus modalnya.
        // Di handleAddItem, kita menambahkannya secara berurutan.
        // Untuk sederhananya, jika user hapus item jual, kita biarkan saja modalnya ada (user bisa hapus manual modalnya)
        // atau kita coba sync. Mari buat hapus terpisah saja agar fleksibel.
        updatedItems.splice(index, 1);
        setData("items", updatedItems);
    };

    const handleRemoveLinkedPurchase = (index) => {
        const updated = [...data.linked_purchases];
        updated.splice(index, 1);
        setData("linked_purchases", updated);
    };

    const handleItemSelect = (selectedOption) => {
        if (!selectedOption) {
            setNewItem({
                ...newItem,
                item_id: "",
                item_name: "",
                price: "",
                purchase_price: "",
                supplier_id: "",
            });
            return;
        }

        const selectedId = selectedOption.value;
        const selectedItem = items.find((i) => i.id == selectedId);

        if (selectedItem) {
            console.log("Selected Item:", selectedItem); // Debugging
            
            // Mencoba mengambil supplier_id dari beberapa kemungkinan field
            const autoSupplierId = selectedItem.contact_id || selectedItem.supplier_id || (selectedItem.contact ? selectedItem.contact.id : "");

            const autoSupplier = suppliers.find(s => s.id == autoSupplierId);

            // Cek apakah customer yang dipilih adalah employee
            const selectedContact = contacts.find(c => c.id == data.contact_id);
            const isEmployee = selectedContact && selectedContact.type === 'EMPLOYEE';
            const priceToUse = isEmployee && parseFloat(selectedItem.purchase_price) > 0 ? selectedItem.purchase_price : selectedItem.price;

            setNewItem({
                ...newItem,
                item_id: String(selectedId),
                item_name: selectedItem.name,
                base_price: priceToUse,
                price: priceToUse,
                base_purchase_price: selectedItem.purchase_price || "",
                purchase_price: selectedItem.purchase_price || "",
                supplier_id: autoSupplierId ? String(autoSupplierId) : "",
                purchase_status: "UNPAID",
                unit: selectedItem.unit || "",
                length: 1,
                width: 1,
            });
        }
    };

    const handleSubmitOrder = (e) => {
        e.preventDefault();
        if (editingOrder) {
            put(route("orders.update", editingOrder.id), {
                onSuccess: () => setCreateOpen(false),
            });
        } else {
            post(route("orders.store"), {
                onSuccess: () => setCreateOpen(false),
            });
        }
    };

    const openDeleteModal = (order) => {
        setOrderToDelete(order);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        destroy(route("orders.destroy", orderToDelete.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    // --- HANDLERS PAYMENT ---
    const openPaymentModal = (order) => {
        setOrderToPay(order);
        // Reset form and set default values explicitly to avoid stale state
        paymentForm.setData({
            account_id: "",
            category_id: "",
            transaction_date: new Date().toISOString().split("T")[0],
            amount: order.debt ? order.debt.remaining : 0,
            note: "",
        });
        paymentForm.clearErrors();
        setPaymentOpen(true);
    };

    const handlePayment = (e) => {
        e.preventDefault();
        paymentForm.post(route("orders.payment", orderToPay.id), {
            onSuccess: () => setPaymentOpen(false),
        });
    };

    // --- HANDLERS PURCHASE MODAL ---
    const openPurchaseModal = (order) => {
        setSelectedOrderForModal(order);
        purchaseForm.reset();
        purchaseForm.setData({
            order_id: order.id,
            contact_id: "",
            reference_number: "",
            transaction_date: new Date().toISOString().split("T")[0],
            status: "UNPAID",
            note: `Modal untuk Order ${order.invoice_number}`,
            account_id: "",
            category_id: "",
            items: [],
        });
        purchaseForm.clearErrors();
        setPurchaseOpen(true);
    };

    const handleAddPurchaseItem = () => {
        if (
            !newPurchaseItem.item_name ||
            !newPurchaseItem.price ||
            !newPurchaseItem.qty
        )
            return;
        purchaseForm.setData("items", [
            ...purchaseForm.data.items,
            { ...newPurchaseItem },
        ]);
        setNewPurchaseItem({ item_name: "", price: "", qty: 1 });
    };

    const handleRemovePurchaseItem = (index) => {
        const items = [...purchaseForm.data.items];
        items.splice(index, 1);
        purchaseForm.setData("items", items);
    };

    const handleSupplierItemSelect = (e) => {
        const item = supplierItems.find((i) => i.id == e.target.value);
        if (item) {
            setNewPurchaseItem({
                ...newPurchaseItem,
                item_name: item.name,
                price: item.price,
            });
        }
    };

    const submitPurchase = (e) => {
        e.preventDefault();
        purchaseForm.post(route("purchases.store"), {
            onSuccess: () => setPurchaseOpen(false),
            preserveScroll: true,
        });
    };

    const grandTotal = data.items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0,
    );

    const contactOptions = contacts.map((contact) => ({
        value: contact.id,
        label: contact.type === 'EMPLOYEE' ? `${contact.name} (Karyawan)` : contact.name,
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Daftar Order" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Penjualan (Order)
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Kelola transaksi penjualan dan faktur pelanggan.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-red-200"
                    >
                        <Plus size={20} />
                        <span>Buat Order Baru</span>
                    </button>
                </div>

                {/* Filter Section */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                    <div className="flex-1 w-full relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Cari No. Invoice atau Pelanggan..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto">
                        <select
                            className="px-4 py-2 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 text-sm bg-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Semua Status</option>
                            <option value="UNPAID">Belum Lunas</option>
                            <option value="PARTIAL">Cicilan</option>
                            <option value="PAID">Lunas</option>
                        </select>

                        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                className="border-none p-0 text-sm focus:ring-0 text-gray-600"
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                            />
                            <span className="text-gray-300">-</span>
                            <input
                                type="date"
                                className="border-none p-0 text-sm focus:ring-0 text-gray-600"
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">No. Invoice</th>
                                    <th className="px-6 py-4">Pelanggan</th>
                                    <th className="px-6 py-4 text-right">
                                        Total
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Sisa Tagihan
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Modal
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Profit
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.data.length > 0 ? (
                                    orders.data.map((order) => {
                                        // Hitung Modal & Profit
                                        const modalTotal =
                                            order.purchases?.reduce(
                                                (sum, p) =>
                                                    sum +
                                                    parseFloat(p.grand_total),
                                                0,
                                            ) || 0;
                                        const profit =
                                            parseFloat(order.grand_total) -
                                            modalTotal;

                                        return (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                    {new Date(
                                                        order.transaction_date,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div>
                                                        {order.invoice_number}
                                                    </div>
                                                    {order.note && (
                                                        <div className="text-xs text-gray-400 font-normal italic mt-0.5">
                                                            {order.note}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {order.contact ? (
                                                        order.contact.name
                                                    ) : (
                                                        <span className="text-gray-400 italic">
                                                            Umum (No Contact)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                    {formatRupiah(
                                                        order.grand_total,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-red-600">
                                                    {order.status === "PAID"
                                                        ? "-"
                                                        : order.debt
                                                          ? formatRupiah(
                                                                order.debt
                                                                    .remaining,
                                                            )
                                                          : formatRupiah(
                                                                order.grand_total,
                                                            )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-red-500">
                                                    {modalTotal > 0
                                                        ? formatRupiah(
                                                              modalTotal,
                                                          )
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-blue-600">
                                                    {formatRupiah(profit)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(order.status)}`}
                                                    >
                                                        {order.status ===
                                                        "UNPAID"
                                                            ? "BELUM LUNAS"
                                                            : order.status}
                                                    </span>
                                                    {order.status === "PAID" &&
                                                        order.transaction
                                                            ?.account && (
                                                            <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                                                                <Wallet
                                                                    size={10}
                                                                />{" "}
                                                                {
                                                                    order
                                                                        .transaction
                                                                        .account
                                                                        .name
                                                                }
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            href={route(
                                                                "orders.show",
                                                                order.id,
                                                            )}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                openPurchaseModal(
                                                                    order,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                                                            title="Input Modal / Purchase"
                                                        >
                                                            <ShoppingBag
                                                                size={16}
                                                            />
                                                        </button>
                                                        {order.status !==
                                                            "PAID" && (
                                                            <button
                                                                onClick={() =>
                                                                    openPaymentModal(
                                                                        order,
                                                                    )
                                                                }
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                                title="Bayar / Cicil"
                                                            >
                                                                <Wallet
                                                                    size={16}
                                                                />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    order,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                                            title="Edit Order"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    order,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                            title="Hapus Order"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-12 text-center text-gray-400"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText
                                                    size={32}
                                                    className="text-gray-300"
                                                />
                                                <p>
                                                    Belum ada data order yang
                                                    ditemukan.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {orders.links && orders.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
                            <div className="flex gap-1">
                                {orders.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || "#"}
                                        className={`px-3 py-1 rounded-lg text-sm ${
                                            link.active
                                                ? "bg-red-600 text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                        } ${!link.url && "opacity-50 cursor-not-allowed"}`}
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

            <OrderFormModal
                show={isCreateOpen}
                onClose={() => setCreateOpen(false)}
                isOwner={isOwner}
                editingOrder={editingOrder}
                handleSubmitOrder={handleSubmitOrder}
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                contactOptions={contactOptions}
                contacts={contacts}
                items={items}
                accounts={accounts}
                categories={categories}
                suppliers={suppliers}
                setAddItemOpen={setAddItemOpen}
                handleRemoveItem={handleRemoveItem}
                handleRemoveLinkedPurchase={handleRemoveLinkedPurchase}
                grandTotal={grandTotal}
                formatRupiah={formatRupiah}
            />

            <AddItemModal
                show={isAddItemOpen}
                onClose={() => setAddItemOpen(false)}
                items={items}
                suppliers={suppliers}
                newItem={newItem}
                setNewItem={setNewItem}
                handleItemSelect={handleItemSelect}
                handleAddItem={handleAddItem}
                formatRupiah={formatRupiah}
                isOwner={isOwner}
            />

            <PurchaseModal
                show={isPurchaseOpen}
                onClose={() => setPurchaseOpen(false)}
                selectedOrderForModal={selectedOrderForModal}
                purchaseForm={purchaseForm}
                submitPurchase={submitPurchase}
                accounts={accounts}
                categories={categories}
                suppliers={suppliers}
                supplierItems={supplierItems}
                newPurchaseItem={newPurchaseItem}
                setNewPurchaseItem={setNewPurchaseItem}
                handleAddPurchaseItem={handleAddPurchaseItem}
                handleRemovePurchaseItem={handleRemovePurchaseItem}
                handleSupplierItemSelect={handleSupplierItemSelect}
                formatRupiah={formatRupiah}
            />

            <DeleteOrderModal
                show={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                orderToDelete={orderToDelete}
                handleDelete={handleDelete}
                processing={processing}
            />

            <PaymentModal
                show={isPaymentOpen}
                onClose={() => setPaymentOpen(false)}
                orderToPay={orderToPay}
                paymentForm={paymentForm}
                handlePayment={handlePayment}
                accounts={accounts}
                categories={categories}
                formatRupiah={formatRupiah}
            />
        </AuthenticatedLayout>
    );
}
