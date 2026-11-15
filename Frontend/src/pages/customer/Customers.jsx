import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Loader2,
} from "lucide-react";

import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  name: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  notes: "",
};

const Customers = () => {
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = user?.role === "company_owner";

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/customers", {
        params: {
          search: search.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });

      setCustomers(response.data.customers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  // Search customers with a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Open form for adding a customer
  const handleAdd = () => {
    setEditingCustomer(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Open form for editing a customer
  const handleEdit = (customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      alternatePhone: customer.alternatePhone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create or update customer
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingCustomer) {
        await API.put(`/customers/${editingCustomer._id}`, form);

        setSuccess("Customer updated successfully.");
      } else {
        await API.post("/customers", form);

        setSuccess("Customer added successfully.");
      }

      setShowForm(false);
      setEditingCustomer(null);
      setForm(initialForm);

      await fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Delete customer (owner only)
  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await API.delete(`/customers/${customer._id}`);

      setSuccess("Customer deleted successfully.");
      await fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete customer.");
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setForm(initialForm);
    setError("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={26} />
            <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Manage your company's customer records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={19} />
          Add Customer
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All Customers</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Customer Count */}
      <div className="text-sm text-gray-500">
        {customers.length} customer(s) found
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={22} />
          Loading customers...
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto mb-3 text-gray-400" size={42} />

          <h3 className="font-semibold text-gray-700">No customers found</h3>

          <p className="mt-1 text-sm text-gray-500">
            Add your first customer to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <div
              key={customer._id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-gray-800">
                    {customer.name}
                  </h3>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      customer.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {customer.status || "active"}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(customer)}
                    title="Edit customer"
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil size={18} />
                  </button>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(customer)}
                      title="Delete customer"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Phone size={17} className="shrink-0 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>

                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={17} className="shrink-0 text-gray-400" />
                    <span className="break-all">{customer.email}</span>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={17}
                      className="mt-0.5 shrink-0 text-gray-400"
                    />
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>

              {customer.notes && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-500">NOTES</p>
                  <p className="mt-1 text-sm text-gray-600">{customer.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter customer name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={form.alternatePhone}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter customer address"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional customer information..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingCustomer
                      ? "Update Customer"
                      : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
