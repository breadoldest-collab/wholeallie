import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function Register() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/api/auth/register', {
        businessName,
        email,
        password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('businessId', res.data.businessId);
      localStorage.setItem('businessName', res.data.businessName || businessName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-[#3b82f6]">Allié</h1>
          <p className="text-gray-400 text-lg">Create your business account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-gray-300 text-sm font-medium">Business Name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-gray-300 text-sm font-medium">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@acme.com"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-gray-300 text-sm font-medium">Password (min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-lg text-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-gray-400 text-sm pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-[#3b82f6] hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
