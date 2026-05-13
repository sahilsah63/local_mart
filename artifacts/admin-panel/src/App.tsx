import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { setAuthTokenGetter, useGetMe } from "@workspace/api-client-react";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Users from "@/pages/users";
import Shops from "@/pages/shops";
import Technicians from "@/pages/technicians";
import Bookings from "@/pages/bookings";
import Products from "@/pages/products";
import Reviews from "@/pages/reviews";
import AdminLayout from "@/components/layout/admin-layout";

// Set up auth token getter
setAuthTokenGetter(() => localStorage.getItem("techni_token"));

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
    }
  });

  useEffect(() => {
    if (!isLoading && (error || !user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [isLoading, error, user, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !user || user.role !== "admin") {
    return null; // Will redirect
  }

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/shops" component={() => <ProtectedRoute component={Shops} />} />
      <Route path="/technicians" component={() => <ProtectedRoute component={Technicians} />} />
      <Route path="/bookings" component={() => <ProtectedRoute component={Bookings} />} />
      <Route path="/products" component={() => <ProtectedRoute component={Products} />} />
      <Route path="/reviews" component={() => <ProtectedRoute component={Reviews} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="techni-admin-theme">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
