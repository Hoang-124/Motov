import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Bikes } from './pages/Bikes';
import { Booking } from './pages/Booking';
import { Bookings } from './pages/Bookings';
import { Auth } from './pages/Auth';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark text-white flex flex-col font-sans selection:bg-neon selection:text-dark">
        {/* Header Navigation */}
        <Header />
        
        {/* Main Content Pages */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bikes" element={<Bikes />} />
            <Route path="/booking/:bikeId" element={<Booking />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}
