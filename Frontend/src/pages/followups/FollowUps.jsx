import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  CalendarClock,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
  X,
  ClipboardList,
} from "lucide-react";

import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  customer: "",
  enquiry: "",
  dueAt: "",
  type: "call",
  notes: "",
  status: "pending",
  completionNote: "",
};

const getLocalDateTime = (date) => {
  const value = new Date(date);
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));

const contactIcons = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  visit: MapPin,
  other: MoreHorizontal,
};

const statusStyles = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const FollowUps = () => {
  const { user } = useAuth();

  const isOwner = user?.role === "company_owner";

  const [followUps, setFollowUps] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [followUpRes, customerRes, enquiryRes] = await Promise.all([
        API.get("/follow-ups"),
        API.get("/customers"),
        API.get("/enquiries"),
      ]);

      setFollowUps(followUpRes.data.followUps || []);
      setCustomers(customerRes.data.customers || []);
      setEnquiries(enquiryRes.data.enquiries || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load follow-ups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateField = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);

    setForm({
      customer: item.customer?._id || "",
      enquiry: item.enquiry?._id || "",
      dueAt: getLocalDateTime(item.dueAt),
      type: item.type || "call",
      notes: item.notes || "",
      status: item.status || "pending",
      completionNote: item.completionNote || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer || !form.dueAt) {
      setError("Please select a customer and due date.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        customer: form.customer,
        enquiry: form.enquiry || null,
        dueAt: new Date(form.dueAt).toISOString(),
        type: form.type,
        notes: form.notes,
        status: form.status,
        completionNote: form.completionNote,
      };

      if (editingId) {
        await API.put(`/follow-ups/${editingId}`, payload);
        setSuccess("Follow-up updated successfully.");
      } else {
        await API.post("/follow-ups", payload);
        setSuccess("Follow-up created successfully.");
      }

      closeModal();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save follow-up.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (item) => {
    const completionNote = window.prompt(
      "Enter completion note (optional):",
      item.completionNote || "",
    );

    if (completionNote === null) return;

    try {
      await API.put(`/follow-ups/${item._id}`, {
        status: "completed",
        completionNote,
      });

      setSuccess("Follow-up marked as completed.");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update follow-up.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this follow-up?")) {
      return;
    }

    try {
      await API.delete(`/follow-ups/${id}`);
      setSuccess("Follow-up deleted successfully.");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete follow-up.");
    }
  };

  const filteredFollowUps = followUps.filter((item) => {
    const customerName = item.customer?.name?.toLowerCase() || "";
    const phone = item.customer?.phone || "";
    const notes = item.notes?.toLowerCase() || "";

    const matchesSearch =
      customerName.includes(search.toLowerCase()) ||
      phone.includes(search) ||
      notes.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const isOverdue =
      item.status === "pending" && new Date(item.dueAt).getTime() < Date.now();

    return matchesSearch && matchesStatus && (!overdueOnly || isOverdue);
  });

  const pendingCount = followUps.filter(
    (item) => item.status === "pending",
  ).length;

  const completedCount = followUps.filter(
    (item) => item.status === "completed",
  ).length;

  const overdueCount = followUps.filter(
    (item) =>
      item.status === "pending" && new Date(item.dueAt).getTime() < Date.now(),
  ).length;

  const getDueStatus = (item) => {
    if (
      item.status === "pending" &&
      new Date(item.dueAt).getTime() < Date.now()
    ) {
      return "Overdue";
    }

    return item.status === "pending" ? "Upcoming" : item.status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Follow-ups</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer calls, meetings and reminders.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Follow-up
        </button>
      </div>

      {/* Messages */}
      {error && !showModal && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Overdue"
          value={overdueCount}
          icon={CalendarClock}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, phone or notes..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="accent-blue-600"
            />
            Overdue only
          </label>
        </div>
      </div>

      {/* Follow-up List */}
      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-500">
          Loading follow-ups...
        </div>
      ) : filteredFollowUps.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <ClipboardList className="mx-auto mb-3 text-gray-400" size={40} />
          <h3 className="font-semibold text-gray-700">No follow-ups found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add a follow-up to keep track of customer communication.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFollowUps.map((item) => {
            const ContactIcon = contactIcons[item.type] || MoreHorizontal;

            return (
              <div
                key={item._id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-800">
                        {item.customer?.name || "Unknown Customer"}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[item.status] || statusStyles.pending
                        }`}
                      >
                        {item.status}
                      </span>

                      {getDueStatus(item) === "Overdue" && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.customer?.phone || "No phone number"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <CalendarClock size={16} />
                        {formatDate(item.dueAt)}
                      </span>

                      <span className="flex items-center gap-2 capitalize">
                        <ContactIcon size={16} />
                        {item.type}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                        {item.notes}
                      </p>
                    )}

                    {item.enquiry?.productName && (
                      <p className="mt-2 text-sm text-blue-600">
                        Enquiry: {item.enquiry.productName}
                      </p>
                    )}

                    <div className="mt-3 text-xs text-gray-400">
                      Created by: {item.createdBy?.name || "Unknown"}
                      {item.assignedTo?.name &&
                        ` · Assigned to: ${item.assignedTo.name}`}
                    </div>

                    {item.status === "completed" && item.completionNote && (
                      <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <strong>Completion note:</strong> {item.completionNote}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                    {item.status === "pending" && (
                      <button
                        onClick={() => handleComplete(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle size={16} />
                        Complete
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(item)}
                      className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
                      title="Edit"
                    >
                      <Pencil size={17} />
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Follow-up" : "Create Follow-up"}
              </h2>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Customer *
                </label>

                <select
                  name="customer"
                  value={form.customer}
                  onChange={updateField}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Related Enquiry (Optional)
                </label>

                <select
                  name="enquiry"
                  value={form.enquiry}
                  onChange={updateField}
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                >
                  <option value="">No enquiry linked</option>
                  {enquiries
                    .filter(
                      (enquiry) =>
                        !form.customer ||
                        enquiry.customer?._id === form.customer ||
                        enquiry.customer === form.customer,
                    )
                    .map((enquiry) => (
                      <option key={enquiry._id} value={enquiry._id}>
                        {enquiry.productName || "General enquiry"} -{" "}
                        {enquiry.customer?.name || "Customer"}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Due Date & Time *
                  </label>

                  <input
                    type="datetime-local"
                    name="dueAt"
                    value={form.dueAt}
                    onChange={updateField}
                    required
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Contact Method
                  </label>

                  <select
                    name="type"
                    value={form.type}
                    onChange={updateField}
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                  >
                    <option value="call">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="visit">Visit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  rows={3}
                  placeholder="What should be discussed with the customer?"
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              {editingId && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={updateField}
                      className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Completion Note
                    </label>

                    <textarea
                      name="completionNote"
                      value={form.completionNote}
                      onChange={updateField}
                      rows={2}
                      placeholder="What happened during the follow-up?"
                      className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Follow-up"
                      : "Create Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
        </div>

        <div className={`rounded-lg p-3 ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

export default FollowUps;
