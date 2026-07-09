import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

interface AppShellProps {
  title: string;
  children: React.ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  const { signOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOutUser();
    navigate('/login');
  };

  const isHomeActive = location.pathname === '/';
  const isStudentsActive = location.pathname.startsWith('/students');

  return (
    <div className="app-shell bg-light min-vh-100">
      <nav className="navbar sticky-top top-nav px-3 py-2">
        <div className="container-fluid align-items-center">
          <div>
            <Link className="navbar-brand mb-0 h5 text-primary" to="/">
              <i className="bi bi-wallet2 me-2"></i>Fee Tracker
            </Link>
            <div className="text-muted-small text-secondary">{title}</div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/" className={`btn btn-sm ${isHomeActive ? 'btn-primary' : 'btn-outline-primary'}`}>
              <i className="bi bi-grid-fill me-1"></i> Dashboard
            </Link>
            <Link to="/students" className={`btn btn-sm ${isStudentsActive ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}>
              <i className="bi bi-people-fill me-1"></i> Students
            </Link>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="container container-max py-4">{children}</main>
    </div>
  );
}
