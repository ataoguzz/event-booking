import React, {Suspense} from "react";
import {useRoutes, Navigate} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext.jsx";

const Login = React.lazy(() => import("../pages/Auth/Login.jsx"));
const Signup = React.lazy(() => import("../pages/Auth/Register.jsx"));

const loading = () => <div className=""></div>;

const LoadComponent = ({ component }) => (
    <Suspense fallback={loading()}>
        {React.createElement(component)}
    </Suspense>
);

const AllRoutes = () => {
    //const {user} = useAuth();
    return useRoutes([
        {
            path: "/",
            element: <Navigate to="/home" />
        },
        {
            path: "/auth",
            children:[
                {path: "login", element: <LoadComponent component={Login} />},
                {path: "signup", element: <LoadComponent component={Signup} />}
            ]
        },
        {
            path: "/home",
            element: <LoadComponent component={Signup} />
        },
        {
            path: "*",
            element: <Navigate to="/auth/login" />
        },
    ])
}

export default AllRoutes;