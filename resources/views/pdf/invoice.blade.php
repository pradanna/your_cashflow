<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Invoice {{ $order->invoice_number }}</title>
    <style>
        /* Reset & Base Styles */
        @page {
            margin: 0px;
            /* Hilangkan margin default halaman agar header bisa full width */
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            color: #333;
            margin: 0;
            padding: 0;
        }

        /* Helper Classes */
        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .text-white {
            color: #ffffff;
        }

        .font-bold {
            font-weight: bold;
        }

        .uppercase {
            text-transform: uppercase;
        }

        /* Header Section (The Red Block) */
        .header-container {
            background-color: #dc2626;
            color: white;
            padding: 40px 40px 20px 40px;
            margin-bottom: 0;
            /* Diubah jadi 0 */
        }

        .header-strip {
            background-color: #2f2f30;
            /* Abu-abu terang (bisa ganti #e5e7eb untuk lebih gelap) */
            height: 20px;
            /* Kira-kira 1/8 dari tinggi header */
            width: 100%;
            margin-bottom: 30px;
            /* Jarak ke konten di bawahnya pindah kesini */
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .company-name {
            font-size: 24pt;
            font-weight: bold;
            margin: 0 0 5px 0;
        }

        .company-sub {
            font-size: 9pt;
            line-height: 1.4;
            opacity: 0.9;
        }

        .invoice-title {
            font-size: 28pt;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 0;
            opacity: 0.5;
            /* Memberikan efek watermark/transparan sedikit */
            text-align: right;
        }

        .invoice-number-large {
            font-size: 12pt;
            margin-top: 5px;
            text-align: right;
        }

        /* Content Wrapper (agar isi tidak mepet pinggir kertas) */
        .content-wrapper {
            padding: 0 40px;
        }

        /* Info Section (Bill To & Meta) */
        .info-table {
            width: 100%;
            margin-bottom: 30px;
        }

        .info-label {
            font-size: 8pt;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }

        .info-value {
            font-size: 11pt;
            font-weight: bold;
            color: #333;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .items-table th {
            background-color: #f3f4f6;
            color: #374151;
            padding: 12px 10px;
            text-align: left;
            font-size: 9pt;
            text-transform: uppercase;
            border-bottom: 2px solid #e5e7eb;
        }

        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #f3f4f6;
        }

        /* Grand Total Section */
        .total-table {
            width: 100%;
            border-collapse: collapse;
        }

        .total-label {
            font-size: 10pt;
            font-weight: bold;
            padding: 10px 0;
            color: #555;
        }

        .total-amount {
            font-size: 16pt;
            font-weight: bold;
            color: #dc2626;
            /* Merah */
            padding: 10px 0;
        }

        /* Footer / Payment Info */
        .footer-info {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px dashed #ddd;
            font-size: 9pt;
            color: #666;
        }

        .status-paid {
            border: 2px solid #fff;
            padding: 5px 15px;
            border-radius: 50px;
            font-size: 10pt;
            font-weight: bold;
            display: inline-block;
            margin-top: 10px;
        }
    </style>
</head>

<body>

    <div class="header-container">
        <table class="header-table">
            <tr>
                <td width="60%" style="vertical-align: top;">
                    <div class="company-name">BIgger Advertising</div>
                    <div class="company-sub">
                        Jl. Ontorejo no 8 Serengan Serengan Surakarta<br>
                        Email: bigger.adv02@gmail.com | WA: 0819-0456-8555
                    </div>
                </td>
                <td width="40%" style="vertical-align: top;" class="text-right">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-number-large">#{{ $order->invoice_number }}</div>
                    <div style="margin-top: 10px;">
                        <span class="status-paid"
                            style="{{ $order->status == 'PAID' ? 'background: rgba(255,255,255,0.2);' : 'background: rgba(0,0,0,0.2);' }}">
                            {{ $order->status == 'UNPAID' ? 'BELUM LUNAS' : $order->status }}
                        </span>
                    </div>
                </td>
            </tr>
        </table>
    </div>
    <div class="header-strip"></div>
    <div class="content-wrapper">

        <table class="info-table">
            <tr>
                <td width="50%" style="vertical-align: top;">
                    <div class="info-label">DITAGIHKAN KEPADA:</div>
                    <div class="info-value">{{ $order->contact->name ?? 'Pelanggan Umum' }}</div>
                    <div style="color: #666; margin-top: 5px;">
                        {{ $order->contact->address ?? '-' }}<br>
                        {{ $order->contact->phone ?? '-' }}
                    </div>
                </td>
                <td width="50%" style="vertical-align: top;" class="text-right">
                    <div class="info-label">TANGGAL TRANSAKSI</div>
                    <div class="info-value">{{ date('d F Y', strtotime($order->transaction_date)) }}</div>
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th width="50%">Deskripsi Item</th>
                    <th width="15%" class="text-center">Qty</th>
                    <th width="20%" class="text-right">Harga Satuan</th>
                    <th width="20%" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($order->items as $item)
                    <tr>
                        <td>
                            <div style="font-weight: bold;">{{ $item->item_name }}</div>
                        </td>
                        <td class="text-center">{{ $item->qty + 0 }}</td>
                        <td class="text-right">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                        <td class="text-right font-bold">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
                @if (count($order->items) < 3)
                    <tr>
                        <td colspan="4" style="height: 50px;"></td>
                    </tr>
                @endif
            </tbody>
        </table>

        <table class="total-table">
            <tr>
                <td width="60%" style="vertical-align: top;">
                    @if ($order->note)
                        <div
                            style="background: #fdf2f2; padding: 10px; border-radius: 5px; border-left: 3px solid #dc2626;">
                            <div class="info-label" style="margin-bottom: 2px;">CATATAN:</div>
                            <span style="font-size: 9pt; color: #555;">{{ $order->note }}</span>
                        </div>
                    @endif
                </td>
                <td width="40%" style="vertical-align: top;">
                    <table width="100%">
                        <tr>
                            <td class="text-right total-label">Grand Total</td>
                            <td class="text-right total-amount">Rp
                                {{ number_format($order->grand_total, 0, ',', '.') }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="footer-info">
            <table width="100%">
                <tr>
                    <td width="60%">
                        <div class="font-bold" style="margin-bottom: 5px;">INFO PEMBAYARAN:</div>
                        Silakan transfer pembayaran ke rekening berikut:<br>
                        <b style="color: #333;">BCA 7850663763</b> a.n. <b style="color: #333;">Pradana Mahendra</b>
                    </td>
                    <td width="40%" class="text-right" style="vertical-align: bottom;">
                        <div style="font-size: 8pt; color: #aaa;">
                            Dicetak otomatis oleh sistem
                        </div>
                    </td>
                </tr>
            </table>
        </div>

    </div>

</body>

</html>
