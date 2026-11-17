import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import MobileNav from '../components/MobileNav';
import FloatingAiButton from '../components/FloatingAiButton';
import AlarmListener from '../components/AlarmListener';
import FloatingFocusWidget from '../components/FloatingFocusWidget';

export default function MainLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-wrapper">
          <Outlet />
        </main>
        <MobileNav />
        <FloatingAiButton />
        <AlarmListener />
        <FloatingFocusWidget />
      </div>
    </div>
  );
}
