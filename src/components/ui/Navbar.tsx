
import { Link, useNavigate } from "react-router-dom";
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
import { Menu, FileText, LogOut, UserIcon, PlusSquare, BarChart2, Settings } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="py-4 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center">
            <FileText className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-bold text-gray-900">InvoiceGen</span>
          </Link>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
              asChild
            >
              <Link to="/dashboard">
                <FileText className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
              asChild
            >
              <Link to="/invoice/new">
                <PlusSquare className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Create Bill</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
              asChild
            >
              <Link to="/reports">
                <BarChart2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Reports</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
              asChild
            >
              <Link to="/settings">
                <Settings className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                  <Menu className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/dashboard")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/invoice/new")}>
                  <PlusSquare className="h-4 w-4 mr-2" />
                  Create Bill
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/reports")}>
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Reports
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleLogout}>
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
