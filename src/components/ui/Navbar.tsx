
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, LogOut, UserIcon, PlusSquare, BarChart3, Settings, Menu } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          {/* Logo - Left */}
          <Link to="/dashboard" className="flex items-center space-x-2 mr-6">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">InvoiceGen</span>
          </Link>

          {/* Navigation Items - Left side */}
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            <Button
              variant={isActive('/dashboard') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/dashboard" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
            
            <Button
              variant={isActive('/invoice/new') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/invoice/new" className="flex items-center space-x-2">
                <PlusSquare className="h-4 w-4" />
                <span>Create Invoice</span>
              </Link>
            </Button>
            
            <Button
              variant={isActive('/reports') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/reports" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </Link>
            </Button>
            
            <Button
              variant={isActive('/settings') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </Button>
          </nav>

          {/* Profile Dropdown - Right side */}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block max-w-32 truncate">
                    {user?.name || 'User'}
                  </span>
                  <Menu className="h-4 w-4 md:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile navigation items */}
                <div className="md:hidden">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/invoice/new")}>
                    <PlusSquare className="h-4 w-4 mr-2" />
                    Create Invoice
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/reports")}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Reports
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                </div>
                
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
