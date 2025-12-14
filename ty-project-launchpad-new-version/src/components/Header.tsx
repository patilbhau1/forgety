
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User as UserIcon, FileText, Package, Calendar, Book } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate("/");
  };

  const handleProfileNavigation = (path: string) => {
    setIsProfileDropdownOpen(false);
    navigate(path);
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: "Past Work", path: "/past-work" },
    { name: "Idea Generator", path: "/idea-generator" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-16">
          <Link to="/" className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">TY</span>
            </div>
            <span className="font-bold text-lg sm:text-xl text-gray-900 truncate">Project Provider</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Profile Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2"
                >
                  <UserIcon size={16} />
                  <span>{user.name || user.email?.split('@')[0]}</span>
                  <ChevronDown size={14} className={`transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
              
              {user && isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  
                  <div className="py-1">
                                        <button onClick={() => handleProfileNavigation('/dashboard')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <UserIcon size={14} /><span>Dashboard</span>
                    </button>
                    <button onClick={() => handleProfileNavigation('/orders')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Package size={14} /><span>My Orders</span>
                    </button>
                    <button onClick={() => handleProfileNavigation('/synopsis')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <FileText size={14} /><span>Upload Synopsis</span>
                    </button>
                    <button onClick={() => handleProfileNavigation('/projects')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <FileText size={14} /><span>My Projects</span>
                    </button>
                    <button onClick={() => handleProfileNavigation('/black-book')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Book size={14} /><span>Black Book</span>
                    </button>
                    <button onClick={() => handleProfileNavigation('/meet')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Calendar size={14} /><span>One-on-One Meet</span>
                    </button>
                  </div>
                  
                  {user && (
                    <div className="border-t border-gray-100 pt-1">
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Sign Out</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
              !isAuthenticated && (
                <div className="flex items-center space-x-3">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )
          )}
        </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg">
            <nav className="flex flex-col px-3 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-base font-medium py-2 px-3 rounded-md transition-colors ${
                    isActive(item.path)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {isAuthenticated && user && (
                <div className="text-sm text-gray-600 py-2 px-3 border-t border-gray-100">
                  Logged in as: {user.name || user.email?.split('@')[0]}
                </div>
              )}
              <div className="flex flex-col space-y-2 pt-3 border-t border-gray-100">
                {user ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                  >
                    Sign Out
                  </Button>
                ) : (
                  <div className="text-sm text-gray-600 py-2 px-3">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-blue-600 hover:text-blue-500">
                      Log In
                    </Link>
                    {" or "}
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="text-blue-600 hover:text-blue-500 font-medium">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
