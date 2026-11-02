"use client";
import { useEffect, useState } from "react";

type N = { id: number; type: string; message: string; read: boolean; createdAt: string };

export default function NotificationBell() {
  const [items, setItems] = useState<N[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then(setItems).catch(() => {});
  }, []);
  const unread = items.filter((i) => !i.read).length;
  async function markRead(id: number) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-md px-2 py-1 text-slate-200 hover:bg-white/10">
        🔔{unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          {items.length === 0 && <p className="text-sm text-slate-500">Aucune notification</p>}
          {items.map((n) => (
            <div key={n.id} className={`mb-1 rounded p-2 text-sm ${n.read ? "text-slate-400" : "text-slate-800"}`}>
              <p>{n.message}</p>
              {!n.read && <button onClick={() => markRead(n.id)} className="text-xs text-blue-600">Marquer lu</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
