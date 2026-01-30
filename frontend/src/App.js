import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import ProfessorPanel from './pages/ProfessorPanel';
import StudentPanel from './pages/StudentPanel';
import './styles/index.css';

function App() {
  const [userRole, setUserRole] = useState('admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="App">
        <header>
          <div className="container">
            <nav className="flex-between">
              <div className="flex gap-20">
                <h1 style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', whiteSpace: 'nowrap' }}>SmartTT</h1>
              </div>
              <div className="nav-links" style={{ 
                display: mobileMenuOpen ? 'flex' : 'none',
                flexDirection: 'column',
                gap: '10px',
                width: '100%',
                marginTop: '10px'
              }}>
                <Link to="/admin" className={userRole === 'admin' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </Link>
                <Link to="/professor" className={userRole === 'professor' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
                  Professor
                </Link>
                <Link to="/student" className={userRole === 'student' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
                  Student
                </Link>
              </div>
            </nav>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/admin" element={<AdminPanel setUserRole={() => setUserRole('admin')} />} />
            <Route path="/professor" element={<ProfessorPanel setUserRole={() => setUserRole('professor')} />} />
            <Route path="/student" element={<StudentPanel setUserRole={() => setUserRole('student')} />} />
            <Route path="/" element={<AdminPanel setUserRole={() => setUserRole('admin')} />} />
          </Routes>
        </main>

        <footer style={{ 
          textAlign: 'center', 
          padding: 'clamp(10px, 3vw, 20px)', 
          marginTop: '40px', 
          borderTop: '1px solid #ddd',
          fontSize: 'clamp(0.8rem, 2vw, 1rem)'
        }}>
          <p>&copy; 2026 SmartTT - Intelligent Timetable Generation System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
