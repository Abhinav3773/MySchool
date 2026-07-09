import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { db } from '../config/firebase';
import { doc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { formatINR } from '../utils/currency';
import type { Charge, Payment, Student } from '../types/models';

export function StudentDetailPage() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !studentId) return;
    setLoading(true);

    // 1. Listen to student document
    const unsubStudent = onSnapshot(doc(db, 'students', studentId), (docSnap) => {
      if (docSnap.exists()) {
        setStudent({ id: docSnap.id, ...docSnap.data() } as Student);
      } else {
        setStudent(null);
      }
    });



    // 2. Listen to student charges
    const qCharges = query(
      collection(db, 'charges'),
      where('studentId', '==', studentId)
    );
    const unsubCharges = onSnapshot(qCharges, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Charge[];
      
      // Sort in memory by chargeDate descending
      setCharges(list.sort((a, b) => (b.chargeDate?.seconds || 0) - (a.chargeDate?.seconds || 0)));
    });

    // 3. Listen to student payments
    const qPayments = query(
      collection(db, 'payments'),
      where('studentId', '==', studentId)
    );
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Payment[];

      // Sort in memory by paymentDate descending
      setPayments(list.sort((a, b) => (b.paymentDate?.seconds || 0) - (a.paymentDate?.seconds || 0)));
      setLoading(false);
    }, () => setLoading(false));

    return () => {
      unsubStudent();
      unsubCharges();
      unsubPayments();
    };
  }, [user, studentId]);

  const totalCharges = useMemo(() => charges.reduce((sum, item) => sum + item.amountPaise, 0), [charges]);
  const totalPaid = useMemo(() => payments.reduce((sum, item) => sum + item.amountPaise, 0), [payments]);
  const outstanding = totalCharges - totalPaid;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading && !student) {
    return (
      <AppShell title="Student details">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!student) {
    return (
      <AppShell title="Student details">
        <div className="alert alert-warning text-center my-4">
          Student record not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={student.name}>
      <div className="card card-shadow p-3 mb-4 animate-fade-in">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h3 className="h4 mb-1 text-primary">{student.name}</h3>
                <span className={`badge bg-${student.status === 'active' ? 'success' : 'secondary'} mb-3`}>
                  {student.status.toUpperCase()}
                </span>
              </div>
            </div>
            <p className="mb-2"><strong>Father:</strong> {student.fatherName}</p>
            <p className="mb-2"><strong>Class:</strong> {student.className} {student.section ? `(${student.section})` : ''}</p>
            <p className="mb-2"><strong>Admission No:</strong> {student.admissionNumber}</p>
            {student.mobile && <p className="mb-2"><strong>Mobile:</strong> {student.mobile}</p>}
          </div>
          <div className="col-12 col-md-6">
            <div className="bg-light rounded p-3 border border-light-subtle">
              <div className="row g-2">
                <div className="col-6">
                  <div className="text-uppercase text-secondary small">Total Charges</div>
                  <div className="h5 mb-2">{formatINR(totalCharges)}</div>
                </div>
                <div className="col-6">
                  <div className="text-uppercase text-secondary small">Total Paid</div>
                  <div className="h5 mb-2 text-success">{formatINR(totalPaid)}</div>
                </div>
                <div className="col-12">
                  <hr className="my-2" />
                  <div className="text-uppercase text-secondary small">Outstanding Balance</div>
                  <div className={`h4 mb-0 ${outstanding > 0 ? 'text-danger' : 'text-success'}`}>
                    {formatINR(outstanding)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card card-shadow p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="h6 mb-0 text-uppercase fw-bold text-secondary">Charge History</h4>
              <span className="badge bg-secondary">{charges.length}</span>
            </div>
            {charges.length === 0 ? (
              <p className="text-muted small my-3 text-center">No charges recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Fee Type</th>
                      <th>Description</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((charge) => (
                      <tr key={charge.id}>
                        <td className="text-nowrap">{formatDate(charge.chargeDate)}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {charge.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{charge.description}</td>
                        <td className="text-end fw-semibold">{formatINR(charge.amountPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card card-shadow p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="h6 mb-0 text-uppercase fw-bold text-secondary">Payment History</h4>
              <span className="badge bg-secondary">{payments.length}</span>
            </div>
            {payments.length === 0 ? (
              <p className="text-muted small my-3 text-center">No payments recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Mode</th>
                      <th>Note</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="text-nowrap">{formatDate(payment.paymentDate)}</td>
                        <td>
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            {payment.paymentMode.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{payment.note || <span className="text-muted">-</span>}</td>
                        <td className="text-end fw-semibold text-success">{formatINR(payment.amountPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex flex-column flex-sm-row gap-2 mt-3">
        <Link className="btn btn-outline-primary btn-lg flex-grow-1" to={`/charges/new?studentId=${student.id}`}>
          Add Charge
        </Link>
        <Link className="btn btn-outline-success btn-lg flex-grow-1" to={`/payments/new?studentId=${student.id}`}>
          Record Payment
        </Link>
        <Link className="btn btn-outline-secondary btn-lg flex-grow-1" to={`/students/${student.id}/edit`}>
          Edit Student
        </Link>
      </div>
    </AppShell>
  );
}
