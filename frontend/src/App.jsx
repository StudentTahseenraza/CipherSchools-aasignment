import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import AssignmentList from './pages/AssignmentList';
import AssignmentAttempt from './pages/AssignmentAttempt';
import Login from './pages/Login';
import Profile from './pages/Profile';
import './styles/main.scss';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/assignments" />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/assignments" 
                element={
                  <ProtectedRoute>
                    <AssignmentList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assignments/:id" 
                element={
                  <ProtectedRoute>
                    <AssignmentAttempt />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;