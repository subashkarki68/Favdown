import * as React from "react";
import { useSession } from "@clerk/clerk-react";
import { Outlet, useNavigate } from "react-router-dom";

export default function DashboardLayout() {
  const { isSignedIn, isLoaded } = useSession();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/sign-in");
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) return "Loading...";

  return <Outlet />;
}
