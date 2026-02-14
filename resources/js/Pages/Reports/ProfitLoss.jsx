import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { formatRupiah } from "@/Utils/format";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Filter, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
];

export default function ProfitLoss({
    auth,
    filters,
    summary,
    income,
    expense,
    categories,
    contacts,
}) {
    const [activeTab, setActiveTab] = useState("INCOME");
    const [filterData, setFilterData] = useState({
        date_start: filters.startDate,
        date_end: filters.endDate,
        category_id: filters.categoryId || "",
        contact_id: filters.contactId || "",
    });

    const handleFilterChange = (key, value) => {
        setFilterData((prev) => ({ ...prev, [key]: value }));
    };

    const applyFilter = () => {
        router.get(route("reports.profit-loss"), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const currentData = activeTab === "INCOME" ? income : expense;
    const currentTotal =
        activeTab === "INCOME" ? summary.income_total : summary.expense_total;
    const TabIcon = activeTab === "INCOME" ? ArrowUpCircle : ArrowDownCircle;
    const tabColor = activeTab === "INCOME" ? "text-green-600" : "text-red-600";
    const barColor = activeTab === "INCOME" ? "#16a34a" : "#dc2626";

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Laporan Detail Pemasukan & Pengeluaran
                </h2>
            }
        >
            <Head title="Laporan Detail" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mulai Tanggal
                            </label>
                            <input
                                type="date"
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                value={filterData.date_start}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "date_start",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sampai Tanggal
                            </label>
                            <input
                                type="date"
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                value={filterData.date_end}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "date_end",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori
                            </label>
                            <select
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm w-40"
                                value={filterData.category_id}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "category_id",
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Semua</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kontak
                            </label>
                            <select
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm w-40"
                                value={filterData.contact_id}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "contact_id",
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Semua</option>
                                {contacts.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={applyFilter}
                            className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Filter size={16} /> Filter
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("INCOME")}
                            className={`pb-2 px-4 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === "INCOME" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <ArrowUpCircle size={18} /> Pemasukan
                        </button>
                        <button
                            onClick={() => setActiveTab("EXPENSE")}
                            className={`pb-2 px-4 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === "EXPENSE" ? "border-b-2 border-red-500 text-red-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <ArrowDownCircle size={18} /> Pengeluaran
                        </button>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
                            Total{" "}
                            {activeTab === "INCOME"
                                ? "Pemasukan"
                                : "Pengeluaran"}{" "}
                            (Terpilih)
                        </h3>
                        <p className={`text-3xl font-bold mt-2 ${tabColor}`}>
                            {formatRupiah(currentTotal)}
                        </p>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart: By Category */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                            <h4 className="font-bold text-gray-700 mb-4">
                                Berdasarkan Kategori
                            </h4>
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={currentData.by_category}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({
                                                cx,
                                                cy,
                                                midAngle,
                                                innerRadius,
                                                outerRadius,
                                                percent,
                                            }) => {
                                                const radius =
                                                    innerRadius +
                                                    (outerRadius -
                                                        innerRadius) *
                                                        0.5;
                                                const x =
                                                    cx +
                                                    radius *
                                                        Math.cos(
                                                            (-midAngle *
                                                                Math.PI) /
                                                                180,
                                                        );
                                                const y =
                                                    cy +
                                                    radius *
                                                        Math.sin(
                                                            (-midAngle *
                                                                Math.PI) /
                                                                180,
                                                        );
                                                return percent > 0.05 ? (
                                                    <text
                                                        x={x}
                                                        y={y}
                                                        fill="white"
                                                        textAnchor={
                                                            x > cx
                                                                ? "start"
                                                                : "end"
                                                        }
                                                        dominantBaseline="central"
                                                        fontSize={12}
                                                    >
                                                        {`${(percent * 100).toFixed(0)}%`}
                                                    </text>
                                                ) : null;
                                            }}
                                        >
                                            {currentData.by_category.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) =>
                                                formatRupiah(value)
                                            }
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: By Contact */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                            <h4 className="font-bold text-gray-700 mb-4">
                                Berdasarkan{" "}
                                {activeTab === "INCOME"
                                    ? "Customer"
                                    : "Supplier"}
                            </h4>
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={currentData.by_contact}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#82ca9d"
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {currentData.by_contact.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                                (index + 2) %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) =>
                                                formatRupiah(value)
                                            }
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar Chart: Trend */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
                            <h4 className="font-bold text-gray-700 mb-4">
                                Tren{" "}
                                {activeTab === "INCOME"
                                    ? "Pemasukan"
                                    : "Pengeluaran"}{" "}
                                Harian
                            </h4>
                            <div className="w-full h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentData.trend}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            tickFormatter={(val) =>
                                                val >= 1000000
                                                    ? `${val / 1000000}M`
                                                    : val
                                            }
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            formatter={(value) =>
                                                formatRupiah(value)
                                            }
                                        />
                                        <Bar
                                            dataKey="amount"
                                            fill={barColor}
                                            radius={[4, 4, 0, 0]}
                                            name="Jumlah"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
