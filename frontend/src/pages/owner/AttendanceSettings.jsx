import { useEffect, useState } from "react";
import API from "../../api/api";

const defaultSettings = {
  latitude: "",
  longitude: "",
  allowedRadius: "200",
  officeStartTime: "10:00",
  officeEndTime: "18:00",
  lunchBreakMinutes: "60",
  requiredWorkingMinutes: "420",
  gracePeriodMinutes: "10",
  absentBelowMinutes: "180",
  halfDayBelowMinutes: "360",
};

const AttendanceSettings = () => {
  const [formData, setFormData] = useState(defaultSettings);

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Convert backend settings into frontend form values
  const formatSettings = (settings) => {
    const location = settings?.officeLocation || {};

    return {
      latitude: location.latitude ?? "",
      longitude: location.longitude ?? "",
      allowedRadius: String(settings?.allowedRadius ?? 200),
      officeStartTime: settings?.officeStartTime ?? "10:00",
      officeEndTime: settings?.officeEndTime ?? "18:00",
      lunchBreakMinutes: String(settings?.lunchBreakMinutes ?? 60),
      requiredWorkingMinutes: String(settings?.requiredWorkingMinutes ?? 420),
      gracePeriodMinutes: String(settings?.gracePeriodMinutes ?? 10),
      absentBelowMinutes: String(settings?.absentBelowMinutes ?? 180),
      halfDayBelowMinutes: String(settings?.halfDayBelowMinutes ?? 360),
    };
  };

  // Load saved attendance settings
  useEffect(() => {
    const fetchAttendanceSettings = async () => {
      try {
        setFetching(true);
        setError("");

        const response = await API.get("/company/attendance-settings");

        setFormData(formatSettings(response.data.attendanceSettings));
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load attendance settings.",
        );
      } finally {
        setFetching(false);
      }
    };

    fetchAttendanceSettings();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get current browser location
  const handleGetLocation = () => {
    setMessage("");
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));

        setLocationLoading(false);
      },
      (locationError) => {
        setError(locationError.message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  // Validate and save attendance settings
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // Check required fields
    const requiredFields = Object.entries(formData);

    if (requiredFields.some(([, value]) => String(value).trim() === "")) {
      setError("Please fill in all attendance settings.");
      return;
    }

    // Convert numeric inputs
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);
    const allowedRadius = Number(formData.allowedRadius);
    const lunchBreakMinutes = Number(formData.lunchBreakMinutes);
    const requiredWorkingMinutes = Number(formData.requiredWorkingMinutes);
    const gracePeriodMinutes = Number(formData.gracePeriodMinutes);
    const absentBelowMinutes = Number(formData.absentBelowMinutes);
    const halfDayBelowMinutes = Number(formData.halfDayBelowMinutes);

    // Validate GPS coordinates
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setError("Please enter a valid latitude.");
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError("Please enter a valid longitude.");
      return;
    }

    // Validate all numeric settings
    const numericValues = {
      allowedRadius,
      lunchBreakMinutes,
      requiredWorkingMinutes,
      gracePeriodMinutes,
      absentBelowMinutes,
      halfDayBelowMinutes,
    };

    for (const [field, value] of Object.entries(numericValues)) {
      if (!Number.isSafeInteger(value) || value < 0) {
        setError(`${field} must be a non-negative whole number.`);
        return;
      }
    }

    if (allowedRadius < 1) {
      setError("Allowed radius must be at least 1 metre.");
      return;
    }

    if (requiredWorkingMinutes < 1) {
      setError("Required working time must be at least 1 minute.");
      return;
    }

    // Validate office time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (
      !timeRegex.test(formData.officeStartTime) ||
      !timeRegex.test(formData.officeEndTime)
    ) {
      setError("Please enter office times in HH:mm format.");
      return;
    }

    // Validate attendance thresholds
    if (
      absentBelowMinutes >= halfDayBelowMinutes ||
      halfDayBelowMinutes >= requiredWorkingMinutes
    ) {
      setError(
        "Absent threshold must be less than half-day threshold, and half-day threshold must be less than required working time.",
      );
      return;
    }

    try {
      setLoading(true);

      const response = await API.put("/company/attendance-settings", {
        officeLocation: {
          latitude,
          longitude,
        },
        allowedRadius,
        officeStartTime: formData.officeStartTime,
        officeEndTime: formData.officeEndTime,
        lunchBreakMinutes,
        requiredWorkingMinutes,
        gracePeriodMinutes,
        absentBelowMinutes,
        halfDayBelowMinutes,
      });

      // Update the form with the values saved by the backend
      setFormData(formatSettings(response.data.attendanceSettings));

      setMessage(
        response.data.message || "Attendance settings updated successfully.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save attendance settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 text-gray-600">Loading attendance settings...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Attendance Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your office location, working hours, and attendance rules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Office Location */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              1. Office Location
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Employees must be within the permitted distance to check in.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locationLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {locationLoading ? "Getting location..." : "Use Current Location"}
          </button>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Enter latitude"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Enter longitude"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Allowed Radius (Metres)
            </label>
            <input
              type="number"
              name="allowedRadius"
              min="1"
              step="1"
              value={formData.allowedRadius}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Example: 200 metres from the office.
            </p>
          </div>
        </section>

        {/* Office Timings */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              2. Office Working Hours
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Set the daily office start and end times.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Office Start Time
              </label>
              <input
                type="time"
                name="officeStartTime"
                value={formData.officeStartTime}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Office End Time
              </label>
              <input
                type="time"
                name="officeEndTime"
                value={formData.officeEndTime}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Break and Working Time */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              3. Working Time Rules
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure required work duration and break time.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lunch Break (Minutes)
              </label>
              <input
                type="number"
                name="lunchBreakMinutes"
                min="0"
                step="1"
                value={formData.lunchBreakMinutes}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Required Working Time (Minutes)
              </label>
              <input
                type="number"
                name="requiredWorkingMinutes"
                min="1"
                step="1"
                value={formData.requiredWorkingMinutes}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Grace Period (Minutes)
              </label>
              <input
                type="number"
                name="gracePeriodMinutes"
                min="0"
                step="1"
                value={formData.gracePeriodMinutes}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Extra time allowed after office start time.
              </p>
            </div>
          </div>
        </section>

        {/* Attendance Thresholds */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              4. Attendance Status Thresholds
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Define work duration limits for absent and half-day attendance.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Absent Below (Minutes)
              </label>
              <input
                type="number"
                name="absentBelowMinutes"
                min="0"
                step="1"
                value={formData.absentBelowMinutes}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Half-Day Below (Minutes)
              </label>
              <input
                type="number"
                name="halfDayBelowMinutes"
                min="1"
                step="1"
                value={formData.halfDayBelowMinutes}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            Example with the default settings:
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Below 180 minutes: Absent</li>
              <li>180 to 359 minutes: Half day</li>
              <li>
                360 to 419 minutes: Between half-day and full-day threshold
              </li>
              <li>420 minutes or more: Required working time reached</li>
            </ul>
          </div>
        </section>

        {/* Success and Error Messages */}
        {message && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving Settings..." : "Save All Settings"}
        </button>
      </form>
    </div>
  );
};

export default AttendanceSettings;
