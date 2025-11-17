"use client";

import React, { useEffect, useState } from "react";

type OrderStatus =
  | "Enquiry"
  | "Quoted"
  | "In Progress"
  | "Waiting on Customer"
  | "Ready"
  | "Completed";

type OrderChannel = "Instagram" | "Website" | "Market" | "Direct" | "Other";
type Fulfilment =
  | "Collection"
  | "Local delivery"
  | "Shipped"
  | "Other";

type StatusFilter = "All" | OrderStatus;
type ChannelFilter = "All" | OrderChannel;
type FulfilmentFilter = "All" | Fulfilment;

type Order = {
  id: string;
  customerName: string;
  item: string;
  status: OrderStatus;
  channel: OrderChannel;
  price: string; // store as string, parse when needed
  depositPaid: boolean;
  dueDate: string;
  createdAt: string;
  notes: string;
  fulfilment: Fulfilment;
};

const STATUSES: OrderStatus[] = [
  "Enquiry",
  "Quoted",
  "In Progress",
  "Waiting on Customer",
  "Ready",
  "Completed",
];

const CHANNELS: OrderChannel[] = [
  "Instagram",
  "Website",
  "Market",
  "Direct",
  "Other",
];

const FULFILMENTS: Fulfilment[] = [
  "Collection",
  "Local delivery",
  "Shipped",
  "Other",
];

const STATUS_FILTERS: StatusFilter[] = ["All", ...STATUSES];
const CHANNEL_FILTERS: ChannelFilter[] = ["All", ...CHANNELS];
const FULFILMENT_FILTERS: FulfilmentFilter[] = ["All", ...FULFILMENTS];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  // New order fields
  const [customerName, setCustomerName] = useState("");
  const [item, setItem] = useState("");
  const [status, setStatus] = useState<OrderStatus>("Enquiry");
  const [channel, setChannel] = useState<OrderChannel>("Instagram");
  const [price, setPrice] = useState("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("Collection");

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("All");
  const [fulfilmentFilter, setFulfilmentFilter] =
    useState<FulfilmentFilter>("All");
  const [search, setSearch] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const saved = window.localStorage.getItem("lifeOS_orders");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Order>[];
        // normalise: ensure fulfilment is set
        const normalised: Order[] = parsed.map((o) => ({
          id: o.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          customerName: o.customerName || "",
          item: o.item || "",
          status: (o.status as OrderStatus) || "Enquiry",
          channel: (o.channel as OrderChannel) || "Instagram",
          price: o.price ?? "",
          depositPaid: !!o.depositPaid,
          dueDate: o.dueDate || "",
          createdAt: o.createdAt || new Date().toISOString(),
          notes: o.notes || "",
          fulfilment: (o.fulfilment as Fulfilment) || "Collection",
        }));
        normalised.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        setOrders(normalised);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    }
  }, []);

  // Save whenever orders change
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lifeOS_orders", JSON.stringify(orders));
      }
    } catch (err) {
      console.error("Failed to save orders", err);
    }
  }, [orders]);

  const addOrder = () => {
    if (!customerName.trim() || !item.trim()) {
      alert("Customer name and item are required.");
      return;
    }

    const now = new Date().toISOString();
    const newOrder: Order = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      customerName: customerName.trim(),
      item: item.trim(),
      status,
      channel,
      price: price.trim(),
      depositPaid,
      dueDate,
      createdAt: now,
      notes: notes.trim(),
      fulfilment,
    };

    setOrders((prev) => [...prev, newOrder]);

    // reset form
    setCustomerName("");
    setItem("");
    setStatus("Enquiry");
    setChannel("Instagram");
    setPrice("");
    setDepositPaid(false);
    setDueDate("");
    setNotes("");
    setFulfilment("Collection");
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  };

  const updateChannel = (id: string, channel: OrderChannel) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, channel } : o))
    );
  };

  const updateFulfilment = (id: string, fulfilment: Fulfilment) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, fulfilment } : o))
    );
  };

  const toggleDeposit = (id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, depositPaid: !o.depositPaid } : o
      )
    );
  };

  const deleteOrder = (id: string) => {
    if (!confirm("Delete this order?")) return;
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // Aggregate numbers
  const openOrders = orders.filter((o) => o.status !== "Completed");
  const openCount = openOrders.length;
  const totalOpenValue = openOrders.reduce((sum, o) => {
    const v = parseFloat(o.price || "0");
    return !Number.isNaN(v) ? sum + v : sum;
  }, 0);

  // Apply filters
  const filtered = orders.filter((o) => {
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    if (channelFilter !== "All" && o.channel !== channelFilter) return false;
    if (fulfilmentFilter !== "All" && o.fulfilment !== fulfilmentFilter)
      return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !o.customerName.toLowerCase().includes(q) &&
        !o.item.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const ordersByStatus: Record<OrderStatus, Order[]> = {
    Enquiry: [],
    Quoted: [],
    "In Progress": [],
    "Waiting on Customer": [],
    Ready: [],
    Completed: [],
  };

  for (const o of filtered) {
    ordersByStatus[o.status].push(o);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            WillMadeThis Orders
          </h1>
          <p className="text-sm text-zinc-400">
            Track enquiries, builds and shipped pieces.
          </p>
        </div>
        <a
          href="/"
          className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          ⬅ Back to dashboard
        </a>
      </header>

      {/* Summary */}
      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-300">
              Overview
            </h2>
            <p className="text-zinc-400">
              Open orders:{" "}
              <span className="text-amber-300 font-semibold">
                {openCount}
              </span>
              {totalOpenValue > 0 && (
                <>
                  {" "}
                  • Est. value:{" "}
                  <span className="text-amber-300 font-semibold">
                    €{totalOpenValue.toFixed(0)}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[11px] text-zinc-500">
              Total orders logged:{" "}
              <span className="text-zinc-100 font-semibold">
                {orders.length}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Filters
          </h2>
          <p className="text-[11px] text-zinc-500">
            Showing{" "}
            <span className="text-zinc-100 font-semibold">
              {filtered.length}
            </span>{" "}
            order{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="block text-zinc-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Channel</label>
            <select
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(e.target.value as ChannelFilter)
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {CHANNEL_FILTERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Fulfilment</label>
            <select
              value={fulfilmentFilter}
              onChange={(e) =>
                setFulfilmentFilter(e.target.value as FulfilmentFilter)
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {FULFILMENT_FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Search (name / item)
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. John, Clew Bay chart..."
            />
          </div>
        </div>
      </section>

      {/* New order form */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">
          Add order / enquiry
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="block text-zinc-400">Customer name</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. John Murphy"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="block text-zinc-400">Item / description</label>
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="Layered chart of Clew Bay..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Price (€)</label>
            <input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. 150"
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <label className="block text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Channel</label>
            <select
              value={channel}
              onChange={(e) =>
                setChannel(e.target.value as OrderChannel)
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Fulfilment</label>
            <select
              value={fulfilment}
              onChange={(e) =>
                setFulfilment(e.target.value as Fulfilment)
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {FULFILMENTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={depositPaid}
                onChange={(e) => setDepositPaid(e.target.checked)}
              />
              <span className="text-zinc-400">Deposit paid</span>
            </label>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-1">
            <label className="block text-zinc-400">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100 h-16 resize-none"
              placeholder="Sizing, custom text, colours, shipping info..."
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addOrder}
              className="w-full md:w-auto text-xs px-3 py-2 rounded-full border border-amber-500 bg-amber-900/40 hover:bg-amber-800/60 text-amber-100 transition"
            >
              + Add order
            </button>
          </div>
        </div>
      </section>

      {/* Board */}
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6 text-xs">
        {STATUSES.map((s) => (
          <div
            key={s}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-zinc-200 text-xs">
                {s}
              </h2>
              <span className="text-zinc-500 text-[11px]">
                {ordersByStatus[s].length}
              </span>
            </div>
            <div className="space-y-2">
              {ordersByStatus[s].map((order) => {
                const priceNum = parseFloat(order.price || "0");
                const priceLabel =
                  !Number.isNaN(priceNum) && priceNum > 0
                    ? `€${priceNum.toFixed(0)}`
                    : order.price || "—";

                return (
                  <article
                    key={order.id}
                    className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-2 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-zinc-100 text-xs font-semibold">
                          {order.customerName}
                        </p>
                        <p className="text-[11px] text-zinc-300">
                          {order.item}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-[10px] text-zinc-500 hover:text-red-400"
                        title="Delete order"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mt-1">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className="rounded bg-zinc-900 border border-zinc-700 px-1 py-0.5 text-[10px] text-zinc-100"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <select
                        value={order.channel}
                        onChange={(e) =>
                          updateChannel(
                            order.id,
                            e.target.value as OrderChannel
                          )
                        }
                        className="rounded bg-zinc-900 border border-zinc-700 px-1 py-0.5 text-[10px] text-zinc-100"
                      >
                        {CHANNELS.map((ch) => (
                          <option key={ch} value={ch}>
                            {ch}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mt-1">
                      <select
                        value={order.fulfilment}
                        onChange={(e) =>
                          updateFulfilment(
                            order.id,
                            e.target.value as Fulfilment
                          )
                        }
                        className="rounded bg-zinc-900 border border-zinc-700 px-1 py-0.5 text-[10px] text-zinc-100"
                      >
                        {FULFILMENTS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-zinc-300">
                        {priceLabel}
                      </p>
                      <button
                        onClick={() => toggleDeposit(order.id)}
                        className={
                          "text-[10px] px-2 py-0.5 rounded-full border " +
                          (order.depositPaid
                            ? "border-emerald-500 text-emerald-300 bg-emerald-900/40"
                            : "border-zinc-600 text-zinc-300 bg-zinc-900")
                        }
                      >
                        {order.depositPaid ? "Deposit ✓" : "Deposit"}
                      </button>
                    </div>
                    {order.dueDate && (
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Due: {order.dueDate}
                      </p>
                    )}
                    {order.notes && (
                      <p className="text-[10px] text-zinc-500 mt-1 line-clamp-3">
                        {order.notes}
                      </p>
                    )}
                  </article>
                );
              })}
              {ordersByStatus[s].length === 0 && (
                <p className="text-[11px] text-zinc-500">
                  No orders in this lane.
                </p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
