"use client";
import { useState } from "react";
import ReservationForm from "./components/ReservationForm";
import ReservationList from "./components/ReservationList";

export default function Home() {
  const [reservations, setReservations] = useState([]);

  function addReservation(newRes) {
    setReservations(prev => [...prev, newRes]);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-100 py-12">
      <ReservationForm onAdd={addReservation} />
      <ReservationList reservations={reservations} />
    </main>
  );
}