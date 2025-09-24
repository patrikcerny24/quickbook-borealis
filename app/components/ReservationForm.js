"use client";
import { useState } from "react";

export default function ReservationForm({ onAdd }) {
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !service || !date || !time) return;
    onAdd({ name, service, date, time });
    setName("");
    setService("");
    setDate("");
    setTime("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-white p-4 rounded shadow max-w-sm w-full">
      <h2 className="font-bold text-lg mb-2">Vytvořit rezervaci</h2>
      <input
        className="border px-2 py-1 rounded"
        placeholder="Jméno"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        className="border px-2 py-1 rounded"
        placeholder="Služba (např. střih, fitness...)"
        value={service}
        onChange={e => setService(e.target.value)}
        required
      />
      <input
        className="border px-2 py-1 rounded"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <input
        className="border px-2 py-1 rounded"
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        required
      />
      <button className="bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700" type="submit">
        Rezervovat
      </button>
    </form>
  );
}