import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Header from './components/Header';
import AssignmentList from './pages/AssignmentList';
import AssignmentAttempt from './pages/AssignmentAttempt';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AssignmentForm from './pages/admin/AssignmentForm';
import './styles/main.scss';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/assignments" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                
                {/* User Routes */}
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

                {/* Admin Routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/assignments/create" 
                  element={
                    <AdminRoute>
                      <AssignmentForm />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/assignments/edit/:id" 
                  element={
                    <AdminRoute>
                      <AssignmentForm />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/assignments/:id" 
                  element={
                    <AdminRoute>
                      <div>Assignment Details View</div>
                    </AdminRoute>
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
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;