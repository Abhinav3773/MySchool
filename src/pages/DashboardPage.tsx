import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { formatINR } from '../utils/currency';

export function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ totalStudents: 0, totalCharges: 0, totalPaid: 0 });

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snap) => {
        setCounts((prev) => ({ ...prev, totalStudents: snap.size }));
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubCharges = onSnapshot(
      collection(db, 'charges'),
      (snap) => {
        const sum = snap.docs.reduce((s, doc) => s + ((doc.data() as { amountPaise: number }).amountPaise ?? 0), 0);
        setCounts((prev) => ({ ...prev, totalCharges: sum }));
      }
    );

    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snap) => {
        const sum = snap.docs.reduce((s, doc) => s + ((doc.data() as { amountPaise: number }).amountPaise ?? 0), 0);
        setCounts((prev) => ({ ...prev, totalPaid: sum }));
      }
    );

    return () => {
      unsubStudents();
      unsubCharges();
      unsubPayments();
    };
  }, [user]);

  const outstandingBalance = useMemo(() => counts.totalCharges - counts.totalPaid, [counts]);

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <div className="mb-4 animate-fade-in">
        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card card-shadow p-3 h-100">
              <div className="text-uppercase text-secondary small">Students</div>
              <div className="h2 mb-0 fw-bold text-primary">{counts.totalStudents}</div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card card-shadow p-3 h-100">
              <div className="text-uppercase text-secondary small">Total Charges</div>
              <div className="h5 mb-0 fw-bold">{formatINR(counts.totalCharges)}</div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card card-shadow p-3 h-100">
              <div className="text-uppercase text-secondary small">Total Paid</div>
              <div className="h5 mb-0 fw-bold text-success">{formatINR(counts.totalPaid)}</div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card card-shadow p-3 h-100">
              <div className="text-uppercase text-secondary small">Outstanding</div>
              <div className={`h5 mb-0 fw-bold ${outstandingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                {formatINR(outstandingBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-shadow p-3">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
          <div>
            <h2 className="h5 mb-1">Quick actions</h2>
            <p className="text-muted mb-0">Add records and search students fast.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/students" className="btn btn-primary">View Students</Link>
            <Link to="/charges/new" className="btn btn-outline-primary">Add Charge</Link>
            <Link to="/payments/new" className="btn btn-outline-success">Record Payment</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
