import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateStudent } from '../services/studentService';
import { normalizeMobile, normalizeText } from '../utils/strings';
import { z } from 'zod';

const studentSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  fatherName: z.string().min(1, 'Father name is required.'),
  className: z.string().min(1, 'Class is required.'),
  admissionNumber: z.string().min(1, 'Admission number is required.'),
  mobile: z.string().optional(),
  section: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

export function StudentEditPage() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    fatherName: '',
    className: '',
    admissionNumber: '',
    section: '',
    mobile: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    const docRef = doc(db, 'students', studentId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const studentData = docSnap.data();
          setForm({
            name: studentData.name || '',
            fatherName: studentData.fatherName || '',
            className: studentData.className || '',
            admissionNumber: studentData.admissionNumber || '',
            section: studentData.section || '',
            mobile: studentData.mobile || '',
            status: studentData.status || 'active',
          });
        } else {
          setError('Student not found.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading student:', err);
        setError('Error loading student data.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [studentId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const parsed = studentSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid form');
      return;
    }
    if (!user || !studentId) return;
    setSaving(true);
    try {
      updateStudent(studentId, {
        name: form.name,
        nameNormalized: normalizeText(form.name),
        fatherName: form.fatherName,
        fatherNameNormalized: normalizeText(form.fatherName),
        className: form.className,
        section: form.section || undefined,
        mobile: form.mobile || undefined,
        mobileNormalized: form.mobile ? normalizeMobile(form.mobile) : undefined,
        admissionNumber: form.admissionNumber,
        admissionNumberNormalized: normalizeText(form.admissionNumber),
        status: form.status as 'active' | 'inactive',
      }).catch((err) => {
        console.error("Firestore background update failed:", err);
        alert("Firestore update failed: " + err.message);
      });
      navigate(`/students/${studentId}`);
    } catch (err: any) {
      console.error("Update student failed:", err);
      setError(err.message || 'Unable to update student.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Edit Student">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Student">
      <div className="card card-shadow p-4 animate-fade-in" style={{ maxWidth: 640 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0 text-primary">Edit Student Details</h2>
          <Link to={`/students/${studentId}`} className="btn btn-sm btn-outline-secondary">
            Cancel
          </Link>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Student name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Father name</label>
            <input
              className="form-control"
              value={form.fatherName}
              onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
              required
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Class</label>
              <input
                className="form-control"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Admission number</label>
              <input
                className="form-control"
                value={form.admissionNumber}
                onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Section</label>
              <input
                className="form-control"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Mobile</label>
              <input
                className="form-control"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}
          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={saving}>
            {saving ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
