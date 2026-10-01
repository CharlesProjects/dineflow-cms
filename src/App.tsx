import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { AuditPage } from './pages/AuditPage'
import { AuthProvider } from './context/AuthContext'
import { AdminLayout } from './pages/AdminLayout'
import { RestaurantHomePage as HomePage } from './pages/RestaurantHomePage'
import { HoursPage } from './pages/HoursPage'
import { GalleryPage } from './pages/GalleryPage'
import { MenuPage } from './pages/MenuPage'
import { OverviewPage } from './pages/OverviewPage'
import { ReservationsPage } from './pages/ReservationsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TeamPage } from './pages/TeamPage'
import { LoginPage } from './pages/LoginPage'
import { AuthSetupPage } from './pages/AuthSetupPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/setup" element={<AuthSetupPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<OverviewPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/menu" element={<MenuPage />} />
          <Route path="/dashboard/hours" element={<HoursPage />} />
          <Route path="/dashboard/reservations" element={<ReservationsPage />} />
          <Route path="/dashboard/gallery" element={<GalleryPage />} />
          <Route path="/dashboard/users" element={<TeamPage />} />
          <Route path="/dashboard/audit" element={<AuditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
