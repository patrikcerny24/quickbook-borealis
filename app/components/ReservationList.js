"use client";

export default function ReservationList({ reservations }) {
  if (!reservations.length) {
    return <div className="text-gray-500 mt-4">Žádné rezervace zatím nejsou.</div>;
  }
  return (
    <div className="mt-6 w-full max-w-md">
      <h2 className="font-bold text-lg mb-2">Seznam rezervací</h2>
      <table className="w-full border-collapse bg-white rounded shadow">
        <thead>
          <tr>
            <th className="border-b p-2 text-left">Jméno</th>
            <th className="border-b p-2 text-left">Služba</th>
            <th className="border-b p-2 text-left">Datum</th>
            <th className="border-b p-2 text-left">Čas</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.service}</td>
              <td className="p-2">{r.date}</td>
              <td className="p-2">{r.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}