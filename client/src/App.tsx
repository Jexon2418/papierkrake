import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import { useAuth } from "@/hooks/useAuth";

// PrivateRoute component for protected routes
function PrivateRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  if (!isAuthenticated) {
    useEffect(() => {
      setLocation("/login");
    }, [setLocation]);
    return null;
  }

  return <Component {...rest} />;
}

// PublicRoute component for routes that shouldn't be accessible when logged in
function PublicRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  if (isAuthenticated) {
    useEffect(() => {
      setLocation("/");
    }, [setLocation]);
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PrivateRoute component={Dashboard} path="/" />} />
      <Route path="/login" component={() => <PublicRoute component={Login} path="/login" />} />
      <Route path="/register" component={() => <PublicRoute component={Login} path="/register" />} />
      
      {/* Redirect to dashboard if at root */}
      <Route path="/">
        <Redirect to="/" />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize auth check
  const { initialize } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsLoading(false);
    };
    init();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-50">
        <div className="animate-spin h-8 w-8 text-primary rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
