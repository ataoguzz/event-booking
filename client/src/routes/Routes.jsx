import {BrowserRouter} from "react-router-dom";

// routes
import AllRoutes from ".";
import {AuthProvider} from "@/contexts/AuthContext.jsx";
import {Toaster} from "@/components/ui/toaster.jsx";

const Routes = () => {
    return (
        <AuthProvider>
            <Toaster/>
            <BrowserRouter>
                <AllRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
};

export default Routes;
