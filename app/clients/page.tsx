// app/clients/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  _id: string;
  name: string;
  address: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      const result = await response.json();

      if (result.success) {
        setClients(result.data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      const response = await fetch(`/api/clients?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setClients(clients.filter((client) => client._id !== id));
      } else {
        alert("Error deleting client: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error deleting client");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <Link href="/clients/new" className="btn btn-primary">
          Add New Client
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client._id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {client.name}
              </h3>
              <div className="flex space-x-2">
                <Link
                  href={`/clients/${client._id}/edit`}
                  className="text-blue-600 hover:text-blue-800 text-sm">
                  Edit
                </Link>
                <button
                  onClick={() => deleteClient(client._id)}
                  className="text-red-600 hover:text-red-800 text-sm">
                  Delete
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <div className="flex items-start">
                <svg
                  className="w-4 h-4 mr-2 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{client.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No clients found</div>
          <Link href="/clients/new" className="btn btn-primary">
            Add your first client
          </Link>
        </div>
      )}
    </div>
  );
}
