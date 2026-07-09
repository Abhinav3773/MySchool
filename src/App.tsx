import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { StudentFormPage } from './pages/StudentFormPage';
import { StudentEditPage } from './pages/StudentEditPage';
import { ChargeFormPage } from './pages/ChargeFormPage';
import { PaymentFormPage } from './pages/PaymentFormPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/new" element={<StudentFormPage />} />
          <Route path="/students/:studentId" element={<StudentDetailPage />} />
          <Route path="/students/:studentId/edit" element={<StudentEditPage />} />
          <Route path="/charges/new" element={<ChargeFormPage />} />
          <Route path="/payments/new" element={<PaymentFormPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
