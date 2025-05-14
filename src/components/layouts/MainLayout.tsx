
import { Outlet } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import { useAuth } from "@/contexts/AuthContext";

const MainLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="py-4 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} InvoiceGen - All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
