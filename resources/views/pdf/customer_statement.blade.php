<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Statement of Account - {{ $contact->name }}</title>
    <style>
        /* 1. RESET & PAGE SETUP */
        @page {
            margin: 0px;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            color: #333;
            margin: 0;
            padding: 0;
        }

        /* 2. HELPER CLASSES */
        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: bold;
        }

        .uppercase {
            text-transform: uppercase;
        }

        .text-red {
            color: #dc2626;
        }

        .text-green {
            color: #16a34a;
        }

        .text-grey {
            color: #6b7280;
        }

        /* 3. HEADER SECTION (RED BLOCK) */
        .header-container {
            background-color: #dc2626;
            /* Red-600 */
            color: white;
            padding: 40px 40px 20px 40px;
            margin-bottom: 0;
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

        .doc-title {
            font-size: 20pt;
            /* Agak lebih kecil dari Invoice karena teks panjang */
            font-weight: bold;
            letter-spacing: 1px;
            margin: 0;
            opacity: 0.5;
            text-align: right;
            text-transform: uppercase;
        }

        /* 4. HEADER STRIP (GREY ACCENT) */
        .header-strip {
            background-color: #2f2f30;
            height: 20px;
            width: 100%;
            margin-bottom: 30px;
        }

        /* 5. CONTENT WRAPPER */
        .content-wrapper {
            padding: 0 40px;
        }

        /* 6. INFO SECTION */
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

        /* 7. DATA TABLE */
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
            vertical-align: top;
        }

        /* Item detail styling */
        .item-list {
            margin-top: 5px;
            font-size: 9pt;
            color: #666;
        }

        .item-row {
            margin-bottom: 2px;
        }

        /* 8. TOTAL SECTION */
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
            padding: 10px 0;
        }

        /* 9. FOOTER */
        .footer-info {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px dashed #ddd;
            font-size: 9pt;
            color: #666;
        }
    </style>
</head>

<body>

    <div class="header-container">
        <table class="header-table">
            <tr>
                <td width="60%" style="vertical-align: top;">
                    <div class="company-name">Bigger Advertising</div>
                    <div class="company-sub">
                        Jl. Ontorejo No. 8, Serengan, Surakarta<br>
                        Email: bigger.adv02@gmail.com | WA: 0819-0456-8555
                    </div>
                </td>
                <td width="40%" style="vertical-align: top;" class="text-right">
                    <div class="doc-title">STATEMENT OF<br>ACCOUNT</div>
                    <div style="margin-top: 5px; font-size: 10pt; opacity: 0.9;">
                        Rekapitulasi Tagihan
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
                    <div class="info-label">TAGIHAN KEPADA:</div>
                    <div class="info-value">{{ $contact->name }}</div>
                    <div style="color: #666; margin-top: 5px;">
                        {{ $contact->address ?? 'Alamat tidak tersedia' }}<br>
                        {{ $contact->phone ?? '' }}
                    </div>
                </td>
                <td width="50%" style="vertical-align: top;" class="text-right">
                    <div class="info-label">PERIODE LAPORAN</div>
                    <div class="info-value">
                        {{ \Carbon\Carbon::parse($startDate)->translatedFormat('d F Y') }} -
                        {{ \Carbon\Carbon::parse($endDate)->translatedFormat('d F Y') }}
                    </div>
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th width="15%">Tanggal</th>
                    <th width="40%">Deskripsi / No. Invoice</th>
                    <th width="15%" class="text-right">Total</th>
                    <th width="15%" class="text-right">Dibayar</th>
                    <th width="15%" class="text-right">Sisa</th>
                </tr>
            </thead>
            <tbody>
                @forelse($invoices as $inv)
                    <tr>
                        <td>{{ $inv->created_at->format('d/m/Y') }}</td>
                        <td>
                            <div class="font-bold text-gray-800">
                                {{ $inv->order ? $inv->order->invoice_number : 'Manual Debt' }}
                            </div>

                            @if ($inv->order && $inv->order->items->count() > 0)
                                <div class="item-list">
                                    @foreach ($inv->order->items as $item)
                                        <div class="item-row">
                                            • {{ $item->item_name }}
                                            <span style="font-size: 8pt; color: #999;">
                                                ({{ $item->qty + 0 }} x {{ number_format($item->price, 0, ',', '.') }})
                                            </span>
                                        </div>
                                    @endforeach
                                </div>
                            @endif
                        </td>
                        <td class="text-right">
                            Rp {{ number_format($inv->amount, 0, ',', '.') }}
                        </td>
                        <td class="text-right text-green">
                            Rp {{ number_format($inv->amount - $inv->remaining, 0, ',', '.') }}
                        </td>
                        <td class="text-right text-red font-bold">
                            Rp {{ number_format($inv->remaining, 0, ',', '.') }}
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="text-center" style="padding: 30px; color: #999;">
                            Tidak ada tagihan pada periode ini.
                        </td>
                    </tr>
                @endforelse

                @if ($invoices->count() > 0 && $invoices->count() < 3)
                    <tr>
                        <td colspan="5" style="height: 50px;"></td>
                    </tr>
                @endif
            </tbody>
        </table>

        <table class="total-table">
            <tr>
                <td width="60%"></td>
                <td width="40%" style="vertical-align: top;">
                    <table width="100%">
                        <tr>
                            <td class="text-right total-label">TOTAL YANG HARUS DIBAYAR</td>
                            <td class="text-right total-amount">
                                Rp {{ number_format($total_remaining, 0, ',', '.') }}
                            </td>
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
