import React, { useState } from 'react';
import { Sparkles, Loader2, Check, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
import { formatRupiah } from '@/Utils/format';

export default function MagicInput() {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        account_id: '',
        category_id: '',
        contact_id: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        status: 'PAID',
        description: '',
        type: '',
        items: [],
        linked_purchases: [],
    });

    const handleParse = async () => {
        if (!text.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setParsedData(null);

        try {
            const response = await axios.post(route('ai.parse'), { text });
            if (response.data.success) {
                const result = response.data.data;
                setParsedData(result);
                
                // Update form data
                setData({
                    ...data,
                    account_id: result.account_id || '',
                    category_id: result.category_id || '',
                    contact_id: result.contact_id || '',
                    amount: result.amount,
                    description: result.description,
                    type: result.type,
                    items: result.items || [],
                    linked_purchases: result.linked_purchases || [],
                });
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Gagal memproses teks. Pastikan format teks berisi unsur nominal.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        
        // Pilih route berdasarkan type
        let saveRoute = route('transactions.store');
        if (data.type === 'SALE') saveRoute = route('orders.store');
        if (data.type === 'PURCHASE') saveRoute = route('purchases.store');

        post(saveRoute, {
            onSuccess: () => {
                setParsedData(null);
                setText('');
                reset();
            },
        });
    };

    const getTypeBadge = (type) => {
        switch(type) {
            case 'SALE': return { label: 'PENJUALAN', class: 'bg-emerald-100 text-emerald-600' };
            case 'PURCHASE': return { label: 'PEMBELIAN', class: 'bg-orange-100 text-orange-600' };
            case 'INCOME': return { label: 'PEMASUKAN', class: 'bg-blue-100 text-blue-600' };
            case 'EXPENSE': return { label: 'PENGELUARAN', class: 'bg-red-100 text-red-600' };
            default: return { label: type, class: 'bg-gray-100 text-gray-600' };
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden relative">
            <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                <Sparkles size={100} className="text-red-600" />
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="bg-red-50 p-2 rounded-lg text-red-600">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Magic Input ✨</h3>
                    <p className="text-xs text-gray-500">Tulis transaksi secara natural, AI akan mendatanya otomatis.</p>
                </div>
            </div>


            <div className="relative">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Contoh: Jual mmt 120rb ke Daihatsu, modal cetak dari Made..."
                    className="w-full rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 min-h-[100px] pr-20 resize-none text-sm transition-all"
                    disabled={isLoading || parsedData}
                />
                
                {!parsedData && (
                    <button
                        onClick={handleParse}
                        disabled={isLoading || !text.trim()}
                        className="absolute right-3 bottom-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-red-700 disabled:bg-gray-300 transition-all flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        Proses AI
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-in fade-in zoom-in">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {parsedData && (
                <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-700">Hasil Analisis AI:</h4>
                        <button 
                            onClick={() => setParsedData(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tipe</p>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeBadge(parsedData.type).class}`}>
                                {getTypeBadge(parsedData.type).label}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Grand Total</p>
                            <p className="text-sm font-bold text-red-600">{formatRupiah(parsedData.amount)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Kategori</p>
                            <p className="text-sm font-bold text-gray-800 truncate" title={parsedData.category_name}>{parsedData.category_name}</p>
                            {!parsedData.category_id && (
                                <p className="text-[9px] text-red-500 mt-1 font-medium italic">Kategori tidak ditemukan</p>
                            )}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Akun</p>
                            <p className="text-sm font-bold text-gray-800">{parsedData.account_name}</p>
                        </div>
                    </div>

                    {/* DAFTAR ITEM (Jika Ada) */}
                    {parsedData.items && parsedData.items.length > 0 && (
                        <div className="mb-4 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2 border-b border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-500">Rincian Barang / Jasa</p>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-4 py-2 font-bold text-gray-600">Item</th>
                                            <th className="px-4 py-2 font-bold text-gray-600 text-center">Qty</th>
                                            <th className="px-4 py-2 font-bold text-gray-600 text-right">Harga</th>
                                            <th className="px-4 py-2 font-bold text-gray-600 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.items.map((item, index) => (
                                            <tr key={index} className="border-b border-gray-100 last:border-0">
                                                <td className="px-4 py-2 text-gray-800 font-medium">{item.item_name}</td>
                                                <td className="px-4 py-2 text-center text-gray-600">{item.qty}</td>
                                                <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.price)}</td>
                                                <td className="px-4 py-2 text-right font-bold text-gray-800">{formatRupiah(item.qty * item.price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* DAFTAR MODAL (Linked Purchases) */}
                    {parsedData.linked_purchases && parsedData.linked_purchases.length > 0 && (
                        <div className="mb-6 bg-purple-50 rounded-xl border border-purple-100 overflow-hidden">
                            <div className="bg-purple-100 px-4 py-2 border-b border-purple-200">
                                <p className="text-[10px] uppercase font-bold text-purple-600">Rincian Modal (Linked Purchase)</p>
                            </div>
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-purple-100">
                                        <th className="px-4 py-2 text-purple-700">Modal</th>
                                        <th className="px-4 py-2 text-purple-700">Supplier</th>
                                        <th className="px-4 py-2 text-purple-700 text-center">Status</th>
                                        <th className="px-4 py-2 text-right text-purple-700">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.linked_purchases.map((lp, index) => (
                                        <tr key={index} className="border-b border-purple-50 last:border-0">
                                            <td className="px-4 py-2 text-purple-900 font-medium">{lp.item_name}</td>
                                            <td className="px-4 py-2 text-purple-800 italic">
                                                {lp.supplier_name}
                                                {lp.supplier_name && !lp.supplier_id && (
                                                    <span className="block text-[8px] text-red-500 font-bold">Supplier tidak ditemukan</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <select
                                                    value={lp.status || 'PAID'}
                                                    onChange={(e) => {
                                                        const newLps = [...data.linked_purchases];
                                                        newLps[index].status = e.target.value;
                                                        setData('linked_purchases', newLps);
                                                        
                                                        const parsedLps = [...parsedData.linked_purchases];
                                                        parsedLps[index].status = e.target.value;
                                                        setParsedData({...parsedData, linked_purchases: parsedLps});
                                                    }}
                                                    className="text-[10px] py-1 px-2 rounded-md border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white text-purple-700"
                                                >
                                                    <option value="PAID">Lunas</option>
                                                    <option value="UNPAID">Hutang</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-purple-900">{formatRupiah(lp.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-4 py-2 bg-purple-100 text-right">
                                <p className="text-[10px] text-purple-600 font-bold uppercase">
                                    Total Modal Terdeteksi: {formatRupiah(parsedData.linked_purchases.reduce((s, i) => s + i.amount, 0))}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Kontak (Customer/Supplier)</p>
                            <p className="text-sm font-bold text-gray-800">{parsedData.contact_name || '-'}</p>
                            {parsedData.contact_name && !parsedData.contact_id && (
                                <p className="text-[9px] text-red-500 mt-1 font-medium italic">Kontak tidak ditemukan di DB</p>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Deskripsi</p>
                            <p className="text-sm text-gray-700 truncate" title={parsedData.description}>{parsedData.description}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tanggal Transaksi</label>
                            <input 
                                type="date" 
                                value={data.transaction_date} 
                                onChange={(e) => setData('transaction_date', e.target.value)} 
                                className="w-full text-sm rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 bg-white" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Status Pembayaran</label>
                            <select 
                                value={data.status} 
                                onChange={(e) => setData('status', e.target.value)} 
                                className="w-full text-sm rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 bg-white"
                            >
                                <option value="PAID">Lunas (Langsung Masuk Akun)</option>
                                <option value="UNPAID">Hutang / Piutang (Belum Dibayar)</option>
                            </select>
                        </div>
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">
                            <div className="font-bold mb-1">Gagal menyimpan data. Terdapat kesalahan:</div>
                            <ul className="list-disc pl-5">
                                {Object.values(errors).map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={processing || !parsedData.category_id || !parsedData.account_id || (parsedData.contact_name && !parsedData.contact_id)}
                            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:bg-gray-300 disabled:shadow-none"
                        >
                            {processing ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                            Konfirmasi & Simpan
                        </button>
                    </div>
                    
                    {(!parsedData.category_id || !parsedData.account_id || (parsedData.contact_name && !parsedData.contact_id)) && (
                        <p className="text-[11px] text-center text-gray-400 mt-3">
                            * Tombol simpan dinonaktifkan jika data tidak cocok dengan database.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
