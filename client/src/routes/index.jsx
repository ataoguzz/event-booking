import React, {Suspense} from "react";
import {useRoutes, Navigate} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext.jsx";

const Login = React.lazy(() => import("../pages/Auth/Login.jsx"));
const Signup = React.lazy(() => import("../pages/Auth/Register.jsx"));
const Home = React.lazy(() => import("../pages/Home/index.jsx"));
const EventCreatePage = React.lazy(() => import("../pages/CreateEvent/index.jsx"));
const AttendeeHomepage = React.lazy(() => import("../pages/Home/AttendeeHomepage.jsx"));
const OrganizerHome = React.lazy(() => import("../pages/Home/OrganizerHomepage.jsx"));
const AdminHomepage = React.lazy(() => import("../pages/Home/AdminHomepage.jsx"));

const loading = () => <div className=""></div>;

const LoadComponent = ({ component }) => (
    <Suspense fallback={loading()}>
        {React.createElement(component)}
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
                {path: "signup", element: <LoadComponent component={Signup} />}
            ]
        },
        {
            path: "/create-event",
            element: user ?  <LoadComponent component={EventCreatePage} /> : <Navigate to="auth/login"/>
        },
        {
            path: "/home",
            element: user ?  <LoadComponent component={Home} /> : <Navigate to="auth/login"/>
        },
        {
            path: "*",
            element: <Navigate to="/auth/login" />
        },
    ])
}

export default AllRoutes;