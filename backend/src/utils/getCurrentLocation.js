const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        resolve({
          latitude,
          longitude,
        });
      },

      (error) => {
        reject(new Error(error.message));
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
};

export default getCurrentLocation;

// Use it when employee clicks Check In
// Example React component:

// src/pages/employee/Attendance.jsx

// import axios from "axios";
// import getCurrentLocation from "../../utils/getCurrentLocation";

// const Attendance = () => {

//   const handleCheckIn = async () => {
//     try {
//       // Get employee location
//       const location = await getCurrentLocation();

//       // Send location to backend
//       const response = await axios.post(
//         "http://localhost:5000/api/attendance/check-in",
//         location,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       alert(response.data.message);

//     } catch (error) {
//       alert(
//         error.response?.data?.message ||
//         error.message ||
//         "Check-in failed"
//       );
//     }
//   };

//   return (
//     <div>
//       <h2>Employee Attendance</h2>

//       <button onClick={handleCheckIn}>
//         Check In
//       </button>
//     </div>
//   );
// };

// export default Attendance;
