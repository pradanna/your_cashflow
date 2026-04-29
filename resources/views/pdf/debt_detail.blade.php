<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $type === 'RECEIVABLE' ? 'Piutang' : 'Hutang' }} - {{ $contact->name }}</title>
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
            font-size: 18pt;
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
            font-size: 8pt;
            color: #666;
            background-color: #fafafa;
            padding: 5px;
            border-radius: 4px;
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
                    <div class="company-name">{{ $company_name }}</div>
                    <div class="company-sub">
                        Jl. Ontorejo No. 8, Serengan, Surakarta<br>
                        Email: bigger.adv02@gmail.com | WA: 0819-0456-8555
                    </div>
                </td>
                <td width="40%" style="vertical-align: top;" class="text-right">
                    <div class="doc-title">RINGKASAN<br>{{ $type === 'RECEIVABLE' ? 'PIUTANG' : 'HUTANG' }}</div>
                    <div style="margin-top: 5px; font-size: 10pt; opacity: 0.9;">
                        Detail Transaksi Belum Lunas
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
                    <div class="info-label">{{ $type === 'RECEIVABLE' ? 'PIUTANG DARI:' : 'HUTANG KEPADA:' }}</div>
                    <div class="info-value">{{ $contact->name }}</div>
                    <div style="color: #666; margin-top: 5px;">
                        {{ $contact->address ?? 'Alamat tidak tersedia' }}<br>
                        {{ $contact->phone ?? '' }}
                    </div>
                </td>
                <td width="50%" style="vertical-align: top;" class="text-right">
                    <div class="info-label">TANGGAL CETAK</div>
                    <div class="info-value">
                        {{ now()->translatedFormat('d F Y') }}
                    </div>
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th width="15%">Tanggal</th>
                    <th width="35%">Referensi / Item</th>
                    <th width="15%" class="text-right">Tagihan</th>
                    <th width="15%" class="text-right">Bayar</th>
                    <th width="15%" class="text-right">Sisa</th>
                </tr>
            </thead>
            <tbody>
                @foreach($debts as $debt)
                    <tr>
                        <td>{{ $debt->created_at->format('d/m/Y') }}</td>
                        <td>
                            <div class="font-bold">
                                {{ $debt->order ? $debt->order->invoice_number : ($debt->purchase ? $debt->purchase->reference_number : 'No Ref') }}
                            </div>

                            @php
                                $items = $debt->order ? $debt->order->items : ($debt->purchase ? $debt->purchase->items : collect([]));
                            @endphp

                            @if ($items->count() > 0)
                                <div class="item-list">
                                    <table width="100%" style="font-size: 8pt; border: none;">
                                        @foreach ($items as $item)
                                            <tr>
                                                <td style="padding: 1px 0;">• {{ $item->item_name }}</td>
                                                <td class="text-right" style="padding: 1px 0; color: #888;">
                                                    {{ $item->qty + 0 }} x {{ number_format($item->price, 0, ',', '.') }}
                                                </td>
                                                <td class="text-right" style="padding: 1px 0; font-weight: bold; width: 60px;">
                                                    {{ number_format($item->subtotal, 0, ',', '.') }}
                                                </td>
                                            </tr>
                                        @endforeach
                                    </table>
                                </div>
                            @endif
                        </td>
                        <td class="text-right">
                            Rp {{ number_format($debt->amount, 0, ',', '.') }}
                        </td>
                        <td class="text-right text-green">
                            Rp {{ number_format($debt->amount - $debt->remaining, 0, ',', '.') }}
                        </td>
                        <td class="text-right text-red font-bold">
                            Rp {{ number_format($debt->remaining, 0, ',', '.') }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <table class="total-table">
            <tr>
                <td width="60%"></td>
                <td width="40%" style="vertical-align: top;">
                    <table width="100%">
                        <tr>
                            <td class="text-right total-label">TOTAL {{ $type === 'RECEIVABLE' ? 'PIUTANG' : 'HUTANG' }}</td>
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
                        @if($type === 'RECEIVABLE')
                        <div class="font-bold" style="margin-bottom: 5px;">INFO PEMBAYARAN:</div>
                        Silakan transfer ke rekening berikut:<br>
                        <b style="color: #333;">BCA 7850663763</b> a.n. <b style="color: #333;">Pradana Mahendra</b>
                        @else
                        <div class="font-bold" style="margin-bottom: 5px;">CATATAN:</div>
                        Segera lakukan pelunasan sesuai dengan tanggal jatuh tempo.
                        @endif
                    </td>
                    <td width="40%" class="text-right" style="vertical-align: bottom;">
                        <div style="font-size: 8pt; color: #aaa;">
                            Dicetak otomatis oleh {{ config('app.name') }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

    </div>

</body>

</html>
