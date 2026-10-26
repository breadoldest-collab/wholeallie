import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SaaSLandingTemplate from './components/ui/saa-s-template';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import CustomerChat from './pages/CustomerChat';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SaaSLandingTemplate />} />
        <Route path="/landing" element={<SaaSLandingTemplate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login initialMode="register" />} />
        <Route path="/support/:businessId" element={<CustomerChat />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/conversations" element={<PrivateRoute><Conversations /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
