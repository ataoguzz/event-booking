import React, {Suspense} from "react";
import {useRoutes, Navigate} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext.jsx";

const Login = React.lazy(() => import("../pages/Auth/Login.jsx"));
const Signup = React.lazy(() => import("../pages/Auth/Register.jsx"));
const Home = React.lazy(() => import("../pages/Home/Index.jsx"));
const AttendeeHomepage = React.lazy(() => import("../pages/Home/AttendeeHomepage.jsx"));
const OrganizerHome = React.lazy(() => import("../pages/Home/OrganizerHomepage.jsx"));
const AdminHomepage = React.lazy(() => import("../pages/Home/AdminHomepage.jsx"));
const SearchPage = React.lazy(() => import("../pages/Events/SearchPage.jsx"));
const EventDetails = React.lazy(() => import("../pages/Events/EventDetails.jsx"));

const loading = () => <div className=""></div>;

const LoadComponent = ({ component }) => (
    <Suspense fallback={loading()}>
        {React.createElement(component)}
    </Suspense>
);

const AllRoutes = () => {
    const { user } = useAuth();
    
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
            path: "/events",
            children: [
                { path: "", element: <Navigate to="/events/search" /> },
                { path: "search", element: <LoadComponent component={SearchPage} /> },
                { path: ":id", element: <LoadComponent component={EventDetails} /> }
            ]
        },
        {
            path: "/home",
            element: <LoadComponent component={Home} />
        },
        {
            path: "*",
            element: <Navigate to="/auth/login" />
        },
    ])
}

export default AllRoutes;