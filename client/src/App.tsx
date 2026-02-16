import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
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

          <Route element={<Layout />}>
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />

            <Route path="/tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
            <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
            <Route path="/verify-ticket" element={<ProtectedRoute roles={['CREATOR']}><VerifyTicket /></ProtectedRoute>} />
            <Route path="/events/create" element={<ProtectedRoute roles={['CREATOR']}><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute roles={['CREATOR']}><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id/attendees" element={<ProtectedRoute roles={['CREATOR']}><AttendeeList /></ProtectedRoute>} />
            <Route path="/promo-codes" element={<ProtectedRoute roles={['CREATOR']}><PromoCodes /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedEvents /></ProtectedRoute>} />
            <Route path="/waitlists" element={<ProtectedRoute><MyWaitlists /></ProtectedRoute>} />
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
