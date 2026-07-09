

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatINR } from '../utils/currency';

function formatShortINR(valuePaise: number) {
  const rupees = valuePaise / 100;
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(1)}L`;
  }
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}k`;
  }
  return `₹${rupees.toFixed(0)}`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ totalStudents: 0, totalCharges: 0, totalPaid: 0 });
  const [chargesByType, setChargesByType] = useState<Record<string, number>>({});

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
        const breakdown: Record<string, number> = {};
        snap.docs.forEach((doc) => {
          const data = doc.data() as { type?: string; amountPaise?: number };
          const type = data.type || 'OTHER';
          breakdown[type] = (breakdown[type] || 0) + (data.amountPaise || 0);
        });
        setCounts((prev) => ({ ...prev, totalCharges: sum }));
        setChargesByType(breakdown);
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

      {/* Visual Analytics Charts */}
      <div className="row g-3 mb-4 animate-fade-in">
        {/* Charges vs Payments Comparison (SVG Bar Chart) */}
        <div className="col-12 col-md-6">
          <div className="card card-shadow p-3 h-100">
            <h3 className="h6 fw-bold text-secondary mb-3">Collection Summary</h3>
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 220 }}>
              {(() => {
                const maxVal = Math.max(counts.totalCharges, counts.totalPaid, 100);
                const chargesHeight = (counts.totalCharges / maxVal) * 140;
                const paymentsHeight = (counts.totalPaid / maxVal) * 140;
                const chargesY = 160 - chargesHeight;
                const paymentsY = 160 - paymentsHeight;
                return (
                  <svg viewBox="0 0 360 200" className="w-100" style={{ maxHeight: 200 }}>
                    <defs>
                      <linearGradient id="chargesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#0d6efd" stopOpacity="0.3" />
                      </linearGradient>
                      <linearGradient id="paymentsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#198754" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#198754" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="320" y2="20" stroke="#e9ecef" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="90" x2="320" y2="90" stroke="#e9ecef" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="160" x2="320" y2="160" stroke="#ced4da" strokeWidth="1.5" />
                    
                    {/* Y Axis labels */}
                    <text x="32" y="24" textAnchor="end" fill="#6c757d" fontSize="9" fontFamily="system-ui">Max</text>
                    <text x="32" y="94" textAnchor="end" fill="#6c757d" fontSize="9" fontFamily="system-ui">50%</text>
                    <text x="32" y="164" textAnchor="end" fill="#6c757d" fontSize="9" fontFamily="system-ui">0</text>

                    {/* Charges Bar */}
                    <rect x="80" y={chargesY} width="55" height={chargesHeight} rx="5" fill="url(#chargesGrad)" stroke="#0d6efd" strokeWidth="1" />
                    <text x="107.5" y={Math.max(15, chargesY - 8)} textAnchor="middle" fill="#0d6efd" fontSize="10" fontWeight="bold" fontFamily="system-ui">
                      {formatShortINR(counts.totalCharges)}
                    </text>
                    <text x="107.5" y="178" textAnchor="middle" fill="#495057" fontSize="10" fontWeight="600" fontFamily="system-ui">Charges</text>

                    {/* Payments Bar */}
                    <rect x="200" y={paymentsY} width="55" height={paymentsHeight} rx="5" fill="url(#paymentsGrad)" stroke="#198754" strokeWidth="1" />
                    <text x="227.5" y={Math.max(15, paymentsY - 8)} textAnchor="middle" fill="#198754" fontSize="10" fontWeight="bold" fontFamily="system-ui">
                      {formatShortINR(counts.totalPaid)}
                    </text>
                    <text x="227.5" y="178" textAnchor="middle" fill="#495057" fontSize="10" fontWeight="600" fontFamily="system-ui">Payments</text>
                  </svg>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Charges by Fee Type (Horizontal Progress Breakdown) */}
        <div className="col-12 col-md-6">
          <div className="card card-shadow p-3 h-100">
            <h3 className="h6 fw-bold text-secondary mb-3">Charges Breakdown</h3>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
              {(() => {
                const total = counts.totalCharges || 1;
                const categories = [
                  { key: 'MONTHLY_FEE', label: 'Monthly Fee', color: 'bg-primary' },
                  { key: 'BOOKS', label: 'Books', color: 'bg-success' },
                  { key: 'DRESS_UNIFORM', label: 'Dress / Uniform', color: 'bg-info' },
                  { key: 'ADMISSION_FEE', label: 'Admission Fee', color: 'bg-warning text-dark' },
                  { key: 'TRANSPORT_FEE', label: 'Transport Fee', color: 'bg-danger' },
                  { key: 'EXAM_FEE', label: 'Exam Fee', color: 'bg-secondary' },
                  { key: 'OTHER', label: 'Other', color: 'bg-dark' },
                ];
                return categories.map((cat) => {
                  const amt = chargesByType[cat.key] || 0;
                  const pct = Math.min(100, Math.round((amt / total) * 100));
                  if (amt === 0) return null; // Only show active categories
                  return (
                    <div key={cat.key} className="small">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold text-dark">{cat.label}</span>
                        <span className="text-muted">{formatINR(amt)} ({pct}%)</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className={`progress-bar ${cat.color}`} role="progressbar" style={{ width: `${pct}%` }} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}></div>
                      </div>
                    </div>
                  );
                });
              })()}
              {Object.keys(chargesByType).length === 0 && (
                <div className="text-muted text-center py-4">No charges recorded yet.</div>
              )}
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
