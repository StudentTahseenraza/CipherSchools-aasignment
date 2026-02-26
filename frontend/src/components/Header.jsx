import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCode, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo" onClick={() => setMobileMenuOpen(false)}>
          <FaCode className="header__logo-icon" />
          <span className="header__logo-text">CipherSQLStudio</span>
        </Link>

        {/* Mobile Menu Button */}
        <button className="header__mobile-toggle" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation */}
        <nav className={`header__nav ${mobileMenuOpen ? 'header__nav--open' : ''}`}>
          <Link 
            to="/assignments" 
            className={`header__nav-link ${location.pathname === '/assignments' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Assignments
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link 
                to="/profile" 
                className={`header__nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <div className="header__user">
                <span className="header__user-name">
                  {user?.name || user?.email?.split('@')[0]}
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
            <Link 
              to="/login" 
              className="header__nav-link header__login-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaUser /> Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;