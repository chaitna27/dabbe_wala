import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import StudentOrders from "./pages/StudentOrders";
import StudentProviders from "./pages/StudentProviders";
import StudentFindMeals from "./pages/StudentFindMeals";
import StudentSubscriptions from "./pages/StudentSubscriptions";

import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderOrders from "./pages/ProviderOrders";
import ProviderMenu from "./pages/ProviderMenu";
import ProviderSubscriptions from "./pages/ProviderSubscriptions";
import CreateOrder from "./pages/CreateOrder";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* STUDENT */}
        <Route
          path="/student/find-meals"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentProviders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/find-meals/:providerId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentFindMeals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/orders"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/subscriptions"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentSubscriptions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-order"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <CreateOrder />
            </ProtectedRoute>
          }
        />

        {/* PROVIDER */}
        <Route
          path="/provider/dashboard"
          element={
            <ProtectedRoute allowedRoles={["provider"]}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider/orders"
          element={
            <ProtectedRoute allowedRoles={["provider"]}>
              <ProviderOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider/:id"
          element={
            <ProtectedRoute allowedRoles={["provider"]}>
              <ProviderMenu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider/subscriptions"
          element={
            <ProtectedRoute allowedRoles={["provider"]}>
              <ProviderSubscriptions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

