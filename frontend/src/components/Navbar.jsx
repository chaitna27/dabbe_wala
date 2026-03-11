import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import '../styles/Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    if (token && userRole) {
      setIsLoggedIn(true);
      setRole(userRole);
    } else {
      setIsLoggedIn(false);
      setRole(null);
    }
  }, [location.pathname]);
  
  // --- ADDED THIS FUNCTION BACK ---
  const goToSection = (id) => {
    if (location.pathname === "/") {
      const element = document.getElementById(id);
      if (element) {
        // Offset of 100px so the floating navbar doesn't cover the title
        const yOffset = -100; 
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      navigate("/");
      // Wait for navigation to finish before scrolling
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <div className={`navbar-wrapper ${isAuthPage ? "auth-nav-wrapper" : ""}`}>
      <nav className={`navbar-main ${isAuthPage ? "auth-nav-main" : ""}`}>
        <h2 className="navbar-logo" onClick={() => navigate("/")}>
          DabbeWala
        </h2>

        {!isAuthPage && (
          <div className="nav-links">
            {isLoggedIn && role === "student" && (
              <>
                <button className="nav-item" onClick={() => navigate("/student/find-meals")}>Find Meals</button>
                <button className="nav-item" onClick={() => navigate("/student/subscriptions")}>Subscriptions</button>
              </>
            )}

            {/* UPDATED THIS BUTTON */}
            <button className="nav-item" onClick={() => goToSection("how-it-works")}>
              How It Works
            </button>

            {!isLoggedIn ? (
              <div className="auth-nav-group">
                <button className="nav-item" onClick={() => navigate("/register")}>Register</button>
                <span className="nav-divider">|</span>
                <button className="nav-item nav-btn-login" onClick={() => navigate("/login")}>Login</button>
              </div>
            ) : (
              <>
                <button className="nav-item" onClick={() => role === "student" ? navigate("/student/orders") : navigate("/provider/dashboard")}>Dashboard</button>
                <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}

export default Navbar;