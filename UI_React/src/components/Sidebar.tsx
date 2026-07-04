import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LayoutDashboard, FileText, Sun, Moon, Car, Gauge } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { to: '/', icon: Gauge, label: 'EdgeGuard Live' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vehicles', icon: Car, label: 'Vehicles' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-500 text-white"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300
        lg:translate-x-0 lg:w-64 w-64 z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-8">Vehicle Manager</h1>
          <nav className="space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-2 rounded-md transition-colors
                  ${isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'}
                `}
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <button
          onClick={toggleTheme}
          className="absolute bottom-8 left-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Toggle theme color"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </>
  );
}