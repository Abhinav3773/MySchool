import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';

export function NotFoundPage() {
  return (
    <AppShell title="Page not found">
      <div className="text-center py-5">
        <h1 className="display-6">404</h1>
        <p>The page you’re looking for does not exist.</p>
        <Link to="/" className="btn btn-primary">Return to dashboard</Link>
      </div>
    </AppShell>
  );
}
