import { calculateDistance } from "./calculateDistance.js";

export const validateAttendanceLocation = (
  employeeLatitude,
  employeeLongitude,
  officeLatitude,
  officeLongitude,
  allowedRadius,
) => {
  if (
    !Number.isFinite(employeeLatitude) ||
    !Number.isFinite(employeeLongitude) ||
    !Number.isFinite(officeLatitude) ||
    !Number.isFinite(officeLongitude)
  ) {
    return {
      valid: false,
      message: "Invalid GPS coordinates",
    };
  }

  const distance = calculateDistance(
    officeLatitude,
    officeLongitude,
    employeeLatitude,
    employeeLongitude,
  );

  return {
    valid: distance <= allowedRadius,
    distance: Math.round(distance),
    message:
      distance <= allowedRadius
        ? "Location verified"
        : "You are outside the permitted office location",
  };
};


// attendanceSettings: {
//   officeLocation: {
//     latitude: Number,
//     longitude: Number,
//   },
//   allowedRadius: {
//     type: Number,
//     default: 200,
//   },
// },