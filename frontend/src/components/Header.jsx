import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaCode, 
  FaUser, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaUserShield,
  FaTachometerAlt,
  FaBook,
  FaHome
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin from localStorage and user object
    const adminStatus = localStorage.getItem('isAdmin') === 'true' || user?.isAdmin === true;
    setIsAdmin(adminStatus);
    
    console.log('Header - Auth State:', { 
      isAuthenticated, 
      user, 
      adminStatus,
      localStorageAdmin: localStorage.getItem('isAdmin')
    });
  }, [user, isAuthenticated, location]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('token');
    setIsAdmin(false);
    navigate('/');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo" onClick={closeMenu}>
          <FaCode className="header__logo-icon" />
          <span className="header__logo-text">CipherSQLStudio</span>
        </Link>

        {/* Mobile Menu Button */}
        <button 
          className="header__mobile-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation */}
        <nav className={`header__nav ${mobileMenuOpen ? 'header__nav--open' : ''}`}>
          {/* <Link 
            to="/" 
            className={`header__nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <FaHome className="header__nav-icon" />
            <span>Home</span>
          </Link> */}

          <Link 
            to="/assignments" 
            className={`header__nav-link ${location.pathname === '/assignments' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <FaBook className="header__nav-icon" />
            <span>Assignments</span>
          </Link>
          
          {/* Show Admin Dashboard link only when admin is logged in */}
          {isAuthenticated && isAdmin && (
            <Link 
              to="/admin/dashboard" 
              className={`header__nav-link admin-link ${location.pathname.includes('/admin') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <FaTachometerAlt className="header__nav-icon" />
              <span>Admin Dashboard</span>
            </Link>
          )}
          
          {isAuthenticated ? (
            <>
              <Link 
                to="/profile" 
                className={`header__nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <FaUser className="header__nav-icon" />
                <span>Profile</span>
              </Link>
              
              <div className="header__user">
                <span className="header__user-name">
                  {user?.name || user?.email?.split('@')[0]}
                  {isAdmin && <span className="admin-badge">(Admin)</span>}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="header__logout-btn"
                  aria-label="Logout"
                >
                  <FaSignOutAlt />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`header__nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <FaUser className="header__nav-icon" />
                <span>Login</span>
              </Link>
              
              {/* Show Admin Login button only when NOT authenticated */}
              {!isAuthenticated && (
                <Link 
                  to="/admin/login" 
                  className={`header__nav-link admin-link ${location.pathname === '/admin/login' ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FaUserShield className="header__nav-icon" />
                  <span>Admin Login</span>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="header__overlay" 
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Header;