import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import DashboardPage from './pages/DashboardPage';
import DashboardPsicologoPage from './pages/DashboardPsicologoPage';
import EvaluacionPage from './pages/EvaluacionPage';
import ResultadoEvaluacionPage from './pages/ResultadoEvaluacionPage';
import ChatIAPage from './pages/ChatIAPage';
import EjerciciosPage from './pages/EjerciciosPage';
import ComunidadPage from './pages/ComunidadPage';
import JuegosPage from './pages/JuegosPage';
import PerfilPage from './pages/PerfilPage';
import NotificacionesPage from './pages/NotificacionesPage';
import InformePadresPage from './pages/InformePadresPage';
import AlertasPsicologoPage from './pages/AlertasPsicologoPage';
import CrearCuestionarioPage from './pages/CrearCuestionarioPage';
import GeminiConfigTest from './components/GeminiConfigTest';
import MainLayout from './components/layout/MainLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

function RoleBasedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user?.rol || '')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/registro"
          element={
            <PublicRoute>
              <RegistroPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-psicologo"
          element={
            <RoleBasedRoute allowedRoles={['PSICOLOGO']}>
              <DashboardPsicologoPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/evaluacion"
          element={
            <ProtectedRoute>
              <EvaluacionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluacion/resultado/:id"
          element={
            <ProtectedRoute>
              <ResultadoEvaluacionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat-ia"
          element={
            <ProtectedRoute>
              <ChatIAPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ejercicios"
          element={
            <ProtectedRoute>
              <EjerciciosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comunidad"
          element={
            <ProtectedRoute>
              <ComunidadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/juegos"
          element={
            <ProtectedRoute>
              <JuegosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notificaciones"
          element={
            <ProtectedRoute>
              <NotificacionesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/informe-padres"
          element={
            <ProtectedRoute>
              <InformePadresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alertas-psicologo"
          element={
            <RoleBasedRoute allowedRoles={['PSICOLOGO']}>
              <AlertasPsicologoPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/crear-cuestionario"
          element={
            <RoleBasedRoute allowedRoles={['PSICOLOGO']}>
              <CrearCuestionarioPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/test-gemini"
          element={
            <ProtectedRoute>
              <GeminiConfigTest />
            </ProtectedRoute>
          }
        />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
