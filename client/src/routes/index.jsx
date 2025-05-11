import React, {Suspense} from "react";
import {useRoutes, Navigate} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext.jsx";

const ForgotPassword = React.lazy(() => import("../pages/Auth/ForgotPassword.jsx"));
const ResetPassword = React.lazy(() => import("../pages/Auth/ResetPassword.jsx"));
const Login = React.lazy(() => import("../pages/Auth/Login.jsx"));
const Signup = React.lazy(() => import("../pages/Auth/SignUp.jsx"));
const Logout = React.lazy(() => import("../pages/Auth/Logout.jsx"));
const DeleteAccount = React.lazy(() => import("../pages/Auth/DeleteAccount.jsx"));
const Home = React.lazy(() => import("../pages/Home"));
const Forbidden = React.lazy(() => import("../pages/Auth/Forbidden.jsx"));

const loading = () => <div className=""></div>;

const LoadComponent = ({component: Component}) => (
    <Suspense fallback={loading()}>
        <Component />
    </Suspense>
);

const AllRoutes = () => {
    const {user} = useAuth();
    return useRoutes([
        {
            path: "/",
            element: <Navigate to="/home" />
        },
        {
            path: "/auth",
            children:[
                {path: "login", element: <LoadComponent component={Login} />},
                {path: "signup", element: <LoadComponent component={Signup} />},
                {path: "logout", element: user ? <LoadComponent component={Logout} /> : <Navigate to="/auth/login" />},
                {path: "forgot-password", element: <LoadComponent component={ForgotPassword} />},
                {path: "reset-password", element: <LoadComponent component={ResetPassword} />},
                {path: "delete-account", element: user ? <LoadComponent component={DeleteAccount} /> : <Navigate to="/auth/login"/>}
            ]
        },
        {
            path: "/home",
            element: user ? <LoadComponent component={Home} /> : <Navigate to="/auth/login"/>
        },
        {
            path: "*",
            element: user ? <Navigate to="/home"/> : <Navigate to="/auth/login" />
        },
        {
            path: "/forbidden",
            element: <LoadComponent component={Forbidden} />
        }
    ])
}

export default AllRoutes;
