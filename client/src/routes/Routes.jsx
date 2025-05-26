import {BrowserRouter} from "react-router-dom";

// routes
import AllRoutes from ".";
import {AuthProvider, useAuth} from "../contexts/AuthContext.jsx";
import {Toaster} from "@/components/ui/toaster.jsx";

const RoutesContent = () => {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <AllRoutes />;
};

const Routes = () => {
    return (
        <AuthProvider>
            <Toaster/>
            <BrowserRouter>
                <RoutesContent />
            </BrowserRouter>
        </AuthProvider>
    );
};

export default Routes;