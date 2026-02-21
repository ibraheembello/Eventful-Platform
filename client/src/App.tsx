import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import MyTickets from './pages/MyTickets';
import Reminders from './pages/Reminders';
import Analytics from './pages/Analytics';
import PaymentCallback from './pages/PaymentCallback';
import VerifyTicket from './pages/VerifyTicket';
import LandingPage from './pages/LandingPage';
import Profile from './pages/Profile';
import SavedEvents from './pages/SavedEvents';
import AttendeeList from './pages/AttendeeList';
import PromoCodes from './pages/PromoCodes';
import MyWaitlists from './pages/MyWaitlists';
import GitHubCallback from './pages/GitHubCallback';
import GoogleCallback from './pages/GoogleCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Categories from './pages/Categories';
import SeriesDetail from './pages/SeriesDetail';

function HomeRoute() {
  return <LandingPage />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          <Route element={<Layout />}>
            <Route path="/categories" element={<Categories />} />
            <Route path="/events" element={<ErrorBoundary><Events /></ErrorBoundary>} />
            <Route path="/events/series/:seriesId" element={<ErrorBoundary><SeriesDetail /></ErrorBoundary>} />
            <Route path="/events/:id" element={<ErrorBoundary><EventDetail /></ErrorBoundary>} />

            <Route path="/tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
            <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
            <Route path="/verify-ticket" element={<ProtectedRoute roles={['CREATOR']}><VerifyTicket /></ProtectedRoute>} />
            <Route path="/events/create" element={<ProtectedRoute roles={['CREATOR']}><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute roles={['CREATOR']}><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id/attendees" element={<ProtectedRoute roles={['CREATOR']}><AttendeeList /></ProtectedRoute>} />
            <Route path="/promo-codes" element={<ProtectedRoute roles={['CREATOR']}><PromoCodes /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedEvents /></ProtectedRoute>} />
            <Route path="/waitlists" element={<ProtectedRoute><ErrorBoundary><MyWaitlists /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/waitlist" element={<Navigate to="/waitlists" replace />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute roles={['CREATOR']}><Analytics /></ProtectedRoute>} />
          </Route>
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
