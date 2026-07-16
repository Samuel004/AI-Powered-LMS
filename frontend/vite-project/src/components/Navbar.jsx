import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Menu, X, LogOut, BookOpen, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">LearnAI</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/courses" className="text-sm text-gray-600 hover:text-gray-900">
              Explore Courses
            </Link>
                        <Link to="/live-classes" className="text-sm text-gray-600 hover:text-gray-900">
                          Live Classes
                        </Link>
            
            {!user ? (
              <>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                {user.role === 'student' && (
                  <>
                    <Link to="/my-courses" className="text-sm text-gray-600 hover:text-gray-900">
                      My Courses
                    </Link>
                    <Link to="/ai-tools" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      AI Tools
                    </Link>
                    <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                      Dashboard
                    </Link>
                  </>
                )}
                {user.role === 'instructor' && (
                  <Link to="/instructor" className="text-sm text-gray-600 hover:text-gray-900">
                    Instructor
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-gray-600">Hi, {user.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/courses"
              className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => setIsOpen(false)}
            >
              Explore Courses
            </Link>
                        <Link
                          to="/live-classes"
                          className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                          onClick={() => setIsOpen(false)}
                        >
                          Live Classes
                        </Link>
            
            {!user ? (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate('/login');
                    setIsOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    navigate('/register');
                    setIsOpen(false);
                  }}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                <div className="px-2 py-2 text-sm text-gray-600">Hi, {user.name}</div>
                {user.role === 'student' && (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/my-courses');
                        setIsOpen(false);
                      }}
                    >
                      My Courses
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/ai-tools');
                        setIsOpen(false);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Tools
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/dashboard');
                        setIsOpen(false);
                      }}
                    >
                      Dashboard
                    </Button>
                  </>
                )}
                {user.role === 'instructor' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/instructor');
                      setIsOpen(false);
                    }}
                  >
                    Instructor
                  </Button>
                )}
                {user.role === 'admin' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/admin');
                      setIsOpen(false);
                    }}
                  >
                    Admin
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
