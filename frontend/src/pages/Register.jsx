import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', university: '', major: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form.name, form.email, form.password, form.university, form.major);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-orb orb1"></div>
                <div className="auth-orb orb2"></div>
                <div className="auth-orb orb3"></div>
            </div>
            <div className="auth-card auth-card-wide">
                <div className="auth-header">
                    <div className="auth-logo">📚</div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join StudyBuddy AI today</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input name="name" type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address *</label>
                            <input name="email" type="email" className="form-input" placeholder="you@university.edu" value={form.email} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input name="password" type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">University</label>
                            <input name="university" type="text" className="form-input" placeholder="MIT, Stanford..." value={form.university} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Major</label>
                            <input name="major" type="text" className="form-input" placeholder="Computer Science..." value={form.major} onChange={handleChange} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <span className="spinner"></span> : 'Create Account'}
                    </button>
                </form>
                <p className="auth-switch">
                    Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
