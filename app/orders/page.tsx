"use client";

import React, { useEffect, useState } from "react";

type OrderStatus =
  | "Enquiry"
  | "Pending"
  | "In Progress"
  | "Waiting on Customer"
  | "Completed"
  | "Cancelled";

type OrderChannel =
  | "Instagram"
  | "Facebook"
  | "Etsy"
  | "Website"
  | "In Person"
  | "Other";

type Fulfilment = "Collection" | "Local Delivery" | "Shipped";

type Order = {
  id: string;
  customerName: string;
  item: string;
  status: OrderStatus;
  channel: OrderChannel;
  price: number | "";
  depositPaid: boolean;
  dueDate: string; // YYYY-MM-DD or empty
  createdAt: string;
  notes: string;
  fulfilment: Fulfilment;
};

const STATUSES: OrderStatus[] = [
  "Enquiry",
  "Pending",
  "In Progress",
  "Waiting on Customer",
  "Completed",
  "Cancelled",
];

const CHANNELS: OrderChannel[] = [
  "Instagram",
  "Facebook",
  "Etsy",
  "Website",
  "In Person",
  "Other",
];

const FULFILMENTS: Fulfilment[] = [
  "Collection",
  "Local Delivery",
  "Shipped",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [item, setItem] = useState("");
  const [status, setStatus] = useState<OrderStatus>("Enquiry");
  const [channel, setChannel] = useState<OrderChannel>("Instagram");
  const [price, setPrice] = useState<string>("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fulfilment, setFulfilment] =
    useState<Fulfilment>("Collection");

  // Filters
  const [statusFilter, setStatusFilter] =
    useState<OrderStatus | "All">("All");
  const [channelFilter, setChannelFilter] =
    useState<OrderChannel | "All">("All");
  const [fulfilmentFilter, setFulfilmentFilter] =
    useState<Fulfilment | "All">("All");
  const [search, setSearch] = useState("");

  // Load from shared localStorage key
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const saved = window.localStorage.getItem("lifeOS_orders");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Order>[];

        const normalised: Order[] = parsed.map((o) => ({
          id:
            o.id ||
            `${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}`,
          customerName: o.customerName || "",
          item: o.item || "",
          status: (o.status as OrderStatus) || "Enquiry",
          channel: (o.channel as OrderChannel) || "Instagram",
          price:
            typeof o.price === "number" || o.price === ""
              ? o.price
              : Number.isNaN(parseFloat(String(o.price)))
              ? ""
              : parseFloat(String(o.price)),
          depositPaid: !!o.depositPaid,
          dueDate: o.dueDate || "",
          createdAt: o.createdAt || new Date().toISOString(),
          notes: o.notes || "",
          fulfilment:
            (o.fulfilment as Fulfilment) || "Collection",
        }));

        normalised.sort((a, b) =>
          a.createdAt > b.createdAt ? 1 : -1
        );
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
        window.localStorage.setItem(
          "lifeOS_orders",
          JSON.stringify(orders)
        );
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

    const parsedPrice =
      price.trim() === "" ? "" : parseFloat(price);

    if (price.trim() !== "" && Number.isNaN(parsedPrice)) {
      alert("Price must be a valid number or left empty.");
      return;
    }

    const now = new Date().toISOString();
    const newOrder: Order = {
      id: `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`,
      customerName: customerName.trim(),
      item: item.trim(),
      status,
      channel,
      price: parsedPrice === "" ? "" : parsedPrice,
      depositPaid,
      dueDate,
      createdAt: now,
      notes: notes.trim(),
      fulfilment,
    };

    setOrders((prev) => [...prev, newOrder]);
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

  const updateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: newStatus } : o
      )
    );
  };

  const updateFulfilment = (
    id: string,
    newFulfilment: Fulfilment
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, fulfilment: newFulfilment } : o
      )
    );
  };

  const toggleDeposit = (id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, depositPaid: !o.depositPaid }
          : o
      )
    );
  };

  const deleteOrder = (id: string) => {
    if (!confirm("Delete this order?")) return;
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // Derived values
  const openOrders = orders.filter(
    (o) => o.status !== "Completed" && o.status !== "Cancelled"
  );

  // Apply filters + search
  let filtered = [...orders];

  if (statusFilter !== "All") {
    filtered = filtered.filter(
      (o) => o.status === statusFilter
    );
  }
  if (channelFilter !== "All") {
    filtered = filtered.filter(
      (o) => o.channel === channelFilter
    );
  }
  if (fulfilmentFilter !== "All") {
    filtered = filtered.filter(
      (o) => o.fulfilment === fulfilmentFilter
    );
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.item.toLowerCase().includes(q) ||
        o.notes.toLowerCase().includes(q)
    );
  }

  const ordersByStatus: Record<OrderStatus, Order[]> = {
    Enquiry: [],
    Pending: [],
    "In Progress": [],
    "Waiting on Customer": [],
    Completed: [],
    Cancelled: [],
  };

  for (const o of filtered) {
    ordersByStatus[o.status].push(o);
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            WillMadeThis Orders
          </h1>
          <p className="text-sm text-zinc-400">
            Shared view for you & Michelle – keep production and
            promises on track.
          </p>
        </div>
        <a
          href="/"
          className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          ⬅ Back to dashboard
        </a>
      </header>

      {/* Summary strip */}
      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-300">
              Overview
            </h2>
            <p className="text-zinc-400">
              Open orders:{" "}
              <span className="text-amber-300 font-semibold">
                {openOrders.length}
              </span>{" "}
              · Total logged:{" "}
              <span className="text-zinc-100 font-semibold">
                {orders.length}
              </span>
            </p>
          </div>
          <div className="text-right text-[11px] text-zinc-500">
            <p>
              Completed:{" "}
              {orders.filter((o) => o.status === "Completed")
                .length}
            </p>
            <p>
              Waiting on customer:{" "}
              {orders.filter(
                (o) => o.status === "Waiting on Customer"
              ).length}
            </p>
          </div>
        </div>
      </section>

      {/* New order form */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">
          Add order
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Customer name
            </label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. Michelle, John, etc."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Item</label>
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. Clew Bay chart, Rounders board..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as OrderStatus)
              }
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
        </div>

        <div className="grid gap-3 md:grid-cols-4 mt-3">
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Price (€)
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. 120"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Deposit paid
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={depositPaid}
                onChange={(e) =>
                  setDepositPaid(e.target.checked)
                }
              />
              <span className="text-zinc-300 text-xs">
                tick if deposit received
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Due date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Fulfilment
            </label>
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
        </div>

        <div className="mt-3 space-y-1">
          <label className="block text-zinc-400">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            rows={2}
            placeholder="e.g. colours, reference photos, special details..."
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={addOrder}
            className="text-xs px-3 py-2 rounded-full border border-amber-500 bg-amber-900/40 hover:bg-amber-800/60 text-amber-100 transition"
          >
            + Add order
          </button>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
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
            <label className="block text-zinc-400">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as OrderStatus | "All"
                )
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="All">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Channel
            </label>
            <select
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(
                  e.target.value as OrderChannel | "All"
                )
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="All">All</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Fulfilment
            </label>
            <select
              value={fulfilmentFilter}
              onChange={(e) =>
                setFulfilmentFilter(
                  e.target.value as Fulfilment | "All"
                )
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="All">All</option>
              {FULFILMENTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="Name, item, notes..."
            />
          </div>
        </div>
      </section>

      {/* Board by status */}
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
              {ordersByStatus[s].map((order) => (
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
                      {order.notes && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {order.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="text-[10px] text-zinc-500 hover:text-red-400"
                      title="Delete order"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <select
                        value={order.fulfilment}
                        onChange={(e) =>
                          updateFulfilment(
                            order.id,
                            e.target.value as Fulfilment
                          )
                        }
                        className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100"
                      >
                        {FULFILMENTS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => toggleDeposit(order.id)}
                        className={
                          "text-[10px] px-2 py-0.5 rounded-full border " +
                          (order.depositPaid
                            ? "border-emerald-500 text-emerald-300 bg-emerald-900/40"
                            : "border-zinc-600 text-zinc-300 bg-zinc-900")
                        }
                      >
                        {order.depositPaid
                          ? "Deposit ✓"
                          : "Deposit"}
                      </button>
                    </div>
                    <div className="text-right text-[10px] text-zinc-500">
                      {order.price !== "" && (
                        <p>€{order.price}</p>
                      )}
                      <p>{order.channel}</p>
                      {order.dueDate && (
                        <p>Due: {order.dueDate}</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
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
