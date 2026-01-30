import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import ProfessorPanel from './pages/ProfessorPanel';
import StudentPanel from './pages/StudentPanel';
import './styles/index.css';

function App() {
  const [userRole, setUserRole] = useState('admin');

  return (
    <Router>
      <div className="App">
        <header>
          <div className="container">
            <nav className="flex-between">
              <div className="flex gap-20">
                <h1 style={{ fontSize: '1.5rem' }}>SmartTT - Intelligent Timetable Generator</h1>
              </div>
              <div className="flex gap-20">
                <Link to="/admin" className={userRole === 'admin' ? 'active' : ''}>
                  Admin Panel
                </Link>
                <Link to="/professor" className={userRole === 'professor' ? 'active' : ''}>
                  Professor Panel
                </Link>
                <Link to="/student" className={userRole === 'student' ? 'active' : ''}>
                  Student Panel
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

        <footer style={{ textAlign: 'center', padding: '20px', marginTop: '40px', borderTop: '1px solid #ddd' }}>
          <p>&copy; 2026 SmartTT - Intelligent Timetable Generation System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
