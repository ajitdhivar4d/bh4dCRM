import { useEffect, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  ImagePlus,
  UserRound,
} from "lucide-react";

import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  customer: "",
  productName: "",
  description: "",
  material: "",
  width: "",
  height: "",
  thickness: "",
  unit: "mm",
  quantity: "",
  notes: "",
};

const statuses = ["new", "contacted", "quoted", "converted", "lost"];

const statusStyles = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  quoted: "bg-purple-100 text-purple-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

const Enquiries = () => {
  const { user } = useAuth();
  const isOwner = user?.role === "company_owner";

  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [referenceImage, setReferenceImage] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch customers and enquiries
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      };

      const [customerResponse, enquiryResponse] = await Promise.all([
        API.get("/customers"),
        API.get("/enquiries", { params }),
      ]);

      setCustomers(customerResponse.data.customers || []);
      setEnquiries(enquiryResponse.data.enquiries || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Open add form
  const handleAdd = () => {
    setEditingEnquiry(null);
    setForm(initialForm);
    setReferenceImage(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (enquiry) => {
    setEditingEnquiry(enquiry);

    setForm({
      customer: enquiry.customer?._id || "",
      productName: enquiry.productName || "",
      description: enquiry.description || "",
      material: enquiry.material || "",
      width: enquiry.dimensions?.width ?? "",
      height: enquiry.dimensions?.height ?? "",
      thickness: enquiry.dimensions?.thickness ?? "",
      unit: enquiry.dimensions?.unit || "mm",
      quantity: enquiry.quantity ?? "",
      notes: enquiry.notes || "",
      status: enquiry.status || "new",
    });

    setReferenceImage(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create or update enquiry
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer) {
      setError("Please select a customer.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        customer: form.customer,
        productName: form.productName,
        description: form.description,
        material: form.material,
        dimensions: {
          width: form.width === "" ? null : Number(form.width),
          height: form.height === "" ? null : Number(form.height),
          thickness: form.thickness === "" ? null : Number(form.thickness),
          unit: form.unit,
        },
        quantity: form.quantity === "" ? null : Number(form.quantity),
        notes: form.notes,
      };

      let enquiryId;

      if (editingEnquiry) {
        await API.put(`/enquiries/${editingEnquiry._id}`, {
          ...payload,
          status: form.status,
        });

        enquiryId = editingEnquiry._id;
      } else {
        const response = await API.post("/enquiries", payload);
        enquiryId = response.data.enquiry._id;
      }

      // Upload image separately after saving the enquiry
      if (referenceImage) {
        const imageData = new FormData();
        imageData.append("referenceImage", referenceImage);

        await API.post(`/enquiries/${enquiryId}/image`, imageData);
      }

      setShowForm(false);
      setEditingEnquiry(null);
      setForm(initialForm);
      setReferenceImage(null);

      setSuccess(
        editingEnquiry
          ? "Enquiry updated successfully."
          : "Enquiry created successfully.",
      );

      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save enquiry.");
    } finally {
      setSaving(false);
    }
  };

  // Delete enquiry (owner only)
  const handleDelete = async (enquiry) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this enquiry?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await API.delete(`/enquiries/${enquiry._id}`);

      setSuccess("Enquiry deleted successfully.");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete enquiry.");
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEnquiry(null);
    setForm(initialForm);
    setReferenceImage(null);
    setError("");
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    const baseURL = API.defaults.baseURL.replace(/\/api\/?$/, "");

    return `${baseURL}${imagePath}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={27} />
            <h1 className="text-2xl font-bold text-gray-800">Enquiries</h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Track customer requirements and product enquiries.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={19} />
          Add Enquiry
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search and status filter */}
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
            placeholder="Search enquiries..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500">
        {enquiries.length} enquiry(s) found
      </p>

      {/* Enquiry list */}
      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-gray-500">
          <Loader2 size={22} className="animate-spin" />
          Loading enquiries...
        </div>
      ) : enquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <ClipboardList size={42} className="mx-auto mb-3 text-gray-400" />

          <h3 className="font-semibold text-gray-700">No enquiries found</h3>

          <p className="mt-1 text-sm text-gray-500">
            Create an enquiry when a customer contacts your company.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enquiries.map((enquiry) => (
            <div
              key={enquiry._id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-gray-800">
                    {enquiry.productName || "General Enquiry"}
                  </h3>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      statusStyles[enquiry.status] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {enquiry.status}
                  </span>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(enquiry)}
                    title="Edit enquiry"
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil size={18} />
                  </button>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(enquiry)}
                      title="Delete enquiry"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <UserRound size={17} className="text-gray-400" />
                  <span>{enquiry.customer?.name || "Customer"}</span>
                </div>

                {enquiry.material && (
                  <p>
                    <span className="font-medium">Material:</span>{" "}
                    {enquiry.material}
                  </p>
                )}

                {enquiry.quantity != null && (
                  <p>
                    <span className="font-medium">Quantity:</span>{" "}
                    {enquiry.quantity}
                  </p>
                )}

                {enquiry.dimensions && (
                  <p>
                    <span className="font-medium">Dimensions:</span>{" "}
                    {[
                      enquiry.dimensions.width,
                      enquiry.dimensions.height,
                      enquiry.dimensions.thickness,
                    ]
                      .filter((value) => value != null)
                      .join(" × ")}
                    {[
                      enquiry.dimensions.width,
                      enquiry.dimensions.height,
                      enquiry.dimensions.thickness,
                    ].some((value) => value != null) &&
                      ` ${enquiry.dimensions.unit || "mm"}`}
                  </p>
                )}
              </div>

              {enquiry.description && (
                <p className="mt-3 text-sm text-gray-600">
                  {enquiry.description}
                </p>
              )}

              {enquiry.notes && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-500">NOTES</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {enquiry.notes}
                  </p>
                </div>
              )}

              {enquiry.referenceImage && (
                <a
                  href={getImageUrl(enquiry.referenceImage)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  <ImagePlus size={17} />
                  View reference image
                </a>
              )}

              <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
                Added{" "}
                {enquiry.createdAt
                  ? new Date(enquiry.createdAt).toLocaleDateString()
                  : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editingEnquiry ? "Edit Enquiry" : "Add New Enquiry"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Product details are optional. You can start with notes.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Customer */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Customer *
                </label>

                <select
                  name="customer"
                  value={form.customer}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Select a customer</option>

                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>

                {customers.length === 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    No customers found. Add a customer before creating an
                    enquiry.
                  </p>
                )}
              </div>

              {/* Product information */}
              <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800">
                  Product Requirements
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    Optional
                  </span>
                </h3>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    placeholder="e.g. Kitchen cabinet, CNC jali"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Describe the customer's requirement..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Material
                  </label>
                  <input
                    name="material"
                    value={form.material}
                    onChange={handleChange}
                    placeholder="e.g. MDF, plywood, acrylic"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Dimensions
                  </label>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      name="width"
                      value={form.width}
                      onChange={handleChange}
                      placeholder="Width"
                      className="min-w-0 rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <input
                      type="number"
                      min="0"
                      step="any"
                      name="height"
                      value={form.height}
                      onChange={handleChange}
                      placeholder="Height"
                      className="min-w-0 rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <input
                      type="number"
                      min="0"
                      step="any"
                      name="thickness"
                      value={form.thickness}
                      onChange={handleChange}
                      placeholder="Thickness"
                      className="min-w-0 rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      className="min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="inch">inch</option>
                      <option value="feet">feet</option>
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Width × Height × Thickness
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Enquiry Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Customer's requirements, discussion, special instructions..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Reference image */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reference Image
                </label>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-5 text-sm text-gray-600 transition hover:border-blue-400 hover:bg-blue-50">
                  <ImagePlus size={20} />
                  {referenceImage
                    ? referenceImage.name
                    : "Choose an image (max 5 MB)"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      setReferenceImage(e.target.files?.[0] || null)
                    }
                  />
                </label>

                {editingEnquiry?.referenceImage && !referenceImage && (
                  <a
                    href={getImageUrl(editingEnquiry.referenceImage)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                  >
                    View currently uploaded image
                  </a>
                )}
              </div>

              {/* Status - edit only */}
              {editingEnquiry && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Enquiry Status
                  </label>

                  <select
                    name="status"
                    value={form.status || "new"}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Buttons */}
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
                  disabled={saving || customers.length === 0}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}

                  {saving
                    ? "Saving..."
                    : editingEnquiry
                      ? "Update Enquiry"
                      : "Save Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;
