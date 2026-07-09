import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { addCharge } from '../services/chargeService';
import { parseINR } from '../utils/currency';
import type { Student } from '../types/models';
import { z } from 'zod';

const chargeSchema = z.object({
  studentId: z.string().min(1, 'Student selection is required.'),
  type: z.string().min(1, 'Type is required.'),
  description: z.string().min(1, 'Description is required.'),
  amount: z.string().min(1, 'Amount is required.'),
  chargeDate: z.string().min(1, 'Date is required.'),
});

export function ChargeFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramStudentId = searchParams.get('studentId') || '';

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [form, setForm] = useState({
    studentId: paramStudentId,
    type: 'MONTHLY_FEE',
    description: '',
    amount: '',
    chargeDate: new Date().toISOString().slice(0, 10),
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

    const parsed = chargeSchema.safeParse(form);
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
      addCharge({
        ownerUid: user.uid,
        studentId: form.studentId,
        type: form.type as any,
        description: form.description.trim(),
        amountPaise: parseINR(form.amount),
        chargeDate: new Date(form.chargeDate),
      }).catch((err) => {
        console.error("Firestore background save failed:", err);
      });
      navigate(`/students/${form.studentId}`);
    } catch (err: any) {
      console.error("Save charge failed:", err);
      setError(err.message || 'Unable to save charge.');
      setSaving(false);
    }
  };

  return (
    <AppShell title="Add Charge">
      <div className="card card-shadow p-4 animate-fade-in" style={{ maxWidth: 640 }}>
        <h2 className="h5 mb-3 text-primary">Record a New Charge</h2>
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
            <label className="form-label fw-semibold">Charge Type</label>
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            >
              <option value="MONTHLY_FEE">Monthly Fee</option>
              <option value="BOOKS">Books</option>
              <option value="DRESS">Dress / Uniform</option>
              <option value="ADMISSION">Admission Fee</option>
              <option value="TRANSPORT">Transport Fee</option>
              <option value="EXAM">Exam Fee</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <input
              className="form-control"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. July 2026 Monthly Tuition Fee"
              required
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="1000"
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                value={form.chargeDate}
                onChange={(e) => setForm({ ...form, chargeDate: e.target.value })}
                required
              />
            </div>
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={saving || loadingStudents}>
            {saving ? 'Saving...' : 'Save Charge'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
