import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddPatient from './pages/AddPatient';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import EditPatient from './pages/EditPatient';
import TodayAppointments from './pages/TodayAppointments';
import FollowUpList from './pages/FollowUpList';
import PaymentStatus from './pages/PaymentStatus';
import './App.css';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/add-patient" element={<PrivateRoute><AddPatient /></PrivateRoute>} />
          <Route path="/patients" element={<PrivateRoute><PatientList /></PrivateRoute>} />
          <Route path="/patients/:id" element={<PrivateRoute><PatientDetail /></PrivateRoute>} />
          <Route path="/patients/:id/edit" element={<PrivateRoute><EditPatient /></PrivateRoute>} />
          <Route path="/appointments" element={<PrivateRoute><TodayAppointments /></PrivateRoute>} />
          <Route path="/followups" element={<PrivateRoute><FollowUpList /></PrivateRoute>} />
          <Route path="/payment-status" element={<PrivateRoute><PaymentStatus /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;