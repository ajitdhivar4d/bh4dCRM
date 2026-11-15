// Register Company
{
  // "name": "Ajit Dhivar",
  // "email": "ajit@example.com",
  // "password": "Ajit@123456",
  // "companyName": "ABC Technologies",
  // "companyEmail": "contact@abc.com",
  // "companyPhone": "9876543210",
  // "address": "Jaipur, Rajasthan"
}

// Super admin  login
// {
//      "email": "bh4dsuperadmin@bh4dcrm.com",
//     "password": "bh4dsuperadmin!"
// }

//Company owner login
// {
//     "email": "ajit@example.com",
//     "password": "Ajit@123456"
// }

//Employee login1
// {
//   "employeeName": "Rahul Sharma1",
//   "email": "rahul@example.com"
//    "password":"Ajit7740"
// }
//Employee login 2
// {
//   "employeeName": "Mohit Sharma",
//   "email": "mohit@example.com"
//    "password":"Mohit7740"
// }

// Super - Admin - update Company Status
// {
//     "status": "active"
// }

// Company Employee Invite
// {
//   "employeeName": "Rahul Sharma",
//   "email": "rahul@example.com"
// }

// Verify Invitation Link
// http://localhost:5000/api/company/verify-invitation?token=43edc81e13032d74ac4f03626487075c1c809a4894d4b6f84fe9dbe6120560bd

// Accept Employee Invitation
// {
//   "token": "43edc81e13032d74ac4f03626487075c1c809a4894d4b6f84fe9dbe6120560bd",
//   "password": "Rahul@12345"
// }

// Module	Available functionality
// Authentication	Login
// Company registration	Register company, pending admin approval
// Super Admin	View pending companies, activate/suspend companies
// Company Owner	Dashboard, invite employees, list employees, view/update employee, activate/deactivate employee
// Attendance	Employee check-in/check-out, attendance history, owner attendance report
// Attendance settings	Office GPS, radius, timings, grace period, working-hour thresholds
// Employee	Dashboard, profile, update profile, company details
// Invitations	Verify invitation and accept invitation
