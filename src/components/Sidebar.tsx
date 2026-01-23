import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import './Sidebar.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard/overview', label: 'Overview', icon: '📊' },
  { path: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
  { path: '/dashboard/slots', label: 'Time Slots', icon: '⏰' },
  { path: '/dashboard/schedule', label: 'Schedule', icon: '📋' },
  { path: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Admin Panel</h2>
      </div>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item--active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <Button
          variant="ghost"
          fullWidth
          onClick={handleSignOut}
          className="sidebar-signout"
        >
          <span className="nav-icon">🚪</span>
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
};

