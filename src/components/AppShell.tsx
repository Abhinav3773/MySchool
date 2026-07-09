import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

interface AppShellProps {
  title: string;
  children: React.ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  const { signOutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOutUser();
    navigate('/login');
  };

  return (
    <div className="app-shell bg-light min-vh-100">
      <nav className="navbar sticky-top top-nav px-3 py-2">
        <div className="container-fluid align-items-center">
          <div>
            <Link className="navbar-brand mb-0 h5" to="/">Fee Tracker</Link>
            <div className="text-muted-small">{title}</div>
          </div>

          <div className="d-flex gap-2">
            <Link to="/dashboard" className="btn btn-outline-primary btn-sm">Dashboard</Link>
            <Link to="/students" className="btn btn-outline-secondary btn-sm">Students</Link>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="container container-max py-4">{children}</main>
    </div>
  );
}
