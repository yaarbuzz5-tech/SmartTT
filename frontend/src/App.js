import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import ProfessorPanel from './pages/ProfessorPanel';
import StudentPanel from './pages/StudentPanel';
import './styles/index.css';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="App">
      <header>
        <div className="container">
          <nav className="nav-main">
            <div className="nav-brand">
              <h1>🎓 SmartTT</h1>
              <p className="subtitle">Intelligent Timetable System</p>
            </div>
            
            <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
              <Link 
                to="/admin" 
                className={`nav-link ${isActive('/admin') || isActive('/') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                📊 Admin Panel
              </Link>
              <Link 
                to="/professor" 
                className={`nav-link ${isActive('/professor') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                👨‍🏫 Professor Panel
              </Link>
              <Link 
                to="/student" 
                className={`nav-link ${isActive('/student') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                👨‍🎓 Student Panel
              </Link>
            </div>

            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/professor" element={<ProfessorPanel />} />
          <Route path="/student" element={<StudentPanel />} />
          <Route path="/" element={<AdminPanel />} />
        </Routes>
      </main>

      <footer>
        <div className="container">
          <p>&copy; 2026 SmartTT - Intelligent Timetable Generation System</p>
          <p className="footer-info">All panels ready for testing and demonstration</p>
        </div>
      </footer>
    </div>
  );
}

export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
