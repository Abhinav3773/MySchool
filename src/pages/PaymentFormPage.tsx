import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { addPayment } from '../services/paymentService';
import { parseINR } from '../utils/currency';
import type { Student } from '../types/models';
import { z } from 'zod';

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Student selection is required.'),
  amount: z.string().min(1, 'Amount is required.'),
  paymentMode: z.string().min(1, 'Payment mode is required.'),
  paymentDate: z.string().min(1, 'Date is required.'),
  note: z.string().optional(),
});

export function PaymentFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramStudentId = searchParams.get('studentId') || '';

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [form, setForm] = useState({
    studentId: paramStudentId,
    amount: '',
    paymentMode: 'CASH',
    paymentDate: new Date().toISOString().slice(0, 10),
    note: '',
    receiptNumber: `RCPT-${Date.now()}`,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingStudents(true);
    const q = query(collection(db, 'students'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Student, 'id'>),
        })) as Student[];
        
        // Sort alphabetically
        setStudents(list.sort((a, b) => a.name.localeCompare(b.name)));
        
        if (paramStudentId) {
          setForm((prev) => ({ ...prev, studentId: paramStudentId }));
        }
        setLoadingStudents(false);
      },
      (error) => {
        console.error('Error loading student directory:', error);
        setLoadingStudents(false);
      }
    );
    return unsubscribe;
  }, [user, paramStudentId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const parsed = paymentSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid form';
      alert("Validation failed: " + msg);
      setError(msg);
      return;
    }

    const amountNum = parseFloat(String(form.amount).replace(/[^\n 0-9.]/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Validation failed: Amount must be greater than 0.");
      setError('Amount must be greater than 0.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      addPayment({
        ownerUid: user.uid,
        studentId: form.studentId,
        amountPaise: parseINR(form.amount),
        paymentDate: new Date(form.paymentDate),
        paymentMode: form.paymentMode as any,
        note: form.note.trim() || undefined,
        receiptNumber: form.receiptNumber,
      }).catch((err) => {
        console.error("Firestore background save failed:", err);
      });
      navigate(`/students/${form.studentId}`);
    } catch (err: any) {
      console.error("Save payment failed:", err);
      setError(err.message || 'Unable to save payment.');
      setSaving(false);
    }
  };
  return (
    <AppShell title="Record Payment">
      <div className="card card-shadow p-4 animate-fade-in" style={{ maxWidth: 640 }}>
        <h2 className="h5 mb-3 text-success">Record a Student Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Select Student</label>
            {loadingStudents ? (
              <div className="form-control-plaintext text-muted">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Loading student directory...
              </div>
            ) : (
              <select
                className="form-select"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                required
              >
                <option value="">-- Choose a Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Class {s.className} - Adm No: {s.admissionNumber})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Amount Paid (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 1500"
              required
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Payment Mode</label>
              <select
                className="form-select"
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                required
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Payment Date</label>
              <input
                type="date"
                className="form-control"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Note (optional)</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Receipt details, transaction ID, etc."
            />
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <button type="submit" className="btn btn-success btn-lg w-100" disabled={saving || loadingStudents}>
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
