import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '⚡' },
    { path: '/subjects', label: 'Subjects', icon: '📚' },
    { path: '/assignments', label: 'Assignments', icon: '📝' },
    { path: '/study-plan', label: 'Study Plan', icon: '🤖' },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span className="brand-icon">📚</span>
                <span className="brand-name">StudyBuddy <span className="brand-ai">AI</span></span>
            </div>
            <div className="navbar-links">
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                    >
                        <span>{link.icon}</span> {link.label}
                    </Link>
                ))}
            </div>
            <div className="navbar-user">
                <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <span className="user-name">{user?.name}</span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
}
