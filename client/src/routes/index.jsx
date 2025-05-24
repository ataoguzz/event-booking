import React, {Suspense} from "react";
import {useRoutes, Navigate} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext.jsx";

// Auth Pages
const Login = React.lazy(() => import("../pages/Auth/Login.jsx"));
const Signup = React.lazy(() => import("../pages/Auth/Register.jsx"));

// Home Pages
const Home = React.lazy(() => import("../pages/Home/index.jsx"));
const AttendeeHomepage = React.lazy(() => import("../pages/Home/AttendeeHomepage.jsx"));
const OrganizerHome = React.lazy(() => import("../pages/Home/OrganizerHomepage.jsx"));
const AdminHomepage = React.lazy(() => import("../pages/Home/AdminHomepage.jsx"));

// Attendee Pages
const BrowseEvents = React.lazy(() => import("../pages/Attendee/BrowseEvents.jsx"));
const MyTickets = React.lazy(() => import("../pages/Attendee/MyTickets.jsx"));
const FindOrganizers = React.lazy(() => import("../pages/Attendee/FindOrganizers.jsx"));

// Organizer Pages
const MyEvents = React.lazy(() => import("../pages/Organizer/MyEvents.jsx"));
const CreateEvent = React.lazy(() => import("../pages/Organizer/CreateEvent.jsx"));
const Followers = React.lazy(() => import("../pages/Organizer/Followers.jsx"));
const Analytics = React.lazy(() => import("../pages/Organizer/Analytics.jsx"));

// Admin Pages
const Dashboard = React.lazy(() => import("../pages/Admin/Dashboard.jsx"));
const ManageEvents = React.lazy(() => import("../pages/Admin/ManageEvents.jsx"));
const ManageVenues = React.lazy(() => import("../pages/Admin/ManageVenues.jsx"));
const ManageUsers = React.lazy(() => import("../pages/Admin/ManageUsers.jsx"));

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
            path: "/login",
            element: <Navigate to="/auth/login" /> // alttakileri degistirmeye usendim
        },
        {
            path: "/auth",
            children:[
                {path: "login", element: <LoadComponent component={Login} />},
                {path: "signup", element: <LoadComponent component={Signup} />}
            ]
        },
        // Attendee Routes
        {
            path: "/browse-events",
            element: user && user.role === "attendee" ? <LoadComponent component={BrowseEvents} /> : <Navigate to="/login" />
        },
        {
            path: "/my-tickets",
            element: user && user.role === "attendee" ? <LoadComponent component={MyTickets} /> : <Navigate to="/login" />
        },
        {
            path: "/find-organizers",
            element: user && user.role === "attendee" ? <LoadComponent component={FindOrganizers} /> : <Navigate to="/login" />
        },
        
        // Organizer Routes
        {
            path: "/my-events",
            element: user && user.role === "organizer" ? <LoadComponent component={MyEvents} /> : <Navigate to="/login" />
        },
        {
            path: "/create-event",
            element: user && user.role === "organizer" ? <LoadComponent component={CreateEvent} /> : <Navigate to="/login" />
        },
        {
            path: "/followers",
            element: user && user.role === "organizer" ? <LoadComponent component={Followers} /> : <Navigate to="/login" />
        },
        {
            path: "/analytics",
            element: user && user.role === "organizer" ? <LoadComponent component={Analytics} /> : <Navigate to="/login" />
        },
        
        // Admin Routes
        {
            path: "/dashboard",
            element: user && user.role === "admin" ? <LoadComponent component={Dashboard} /> : <Navigate to="/login" />
        },
        {
            path: "/events",
            element: user && user.role === "admin" ? <LoadComponent component={ManageEvents} /> : <Navigate to="/login" />
        },
        {
            path: "/venues",
            element: user && user.role === "admin" ? <LoadComponent component={ManageVenues} /> : <Navigate to="/login" />
        },
        {
            path: "/users",
            element: user && user.role === "admin" ? <LoadComponent component={ManageUsers} /> : <Navigate to="/login" />
        },
        
        // Legacy routes - kept for backward compatibility ?????
        {
            path: "/create-event",
            element: user ? <Navigate to="/organizer/create-event" /> : <Navigate to="/login" />
        },
        {
            path: "/home",
            element: user ? <LoadComponent component={Home} /> : <Navigate to="/login" />
        },
        {
            path: "*",
            element: <Navigate to="/home" />
        },
    ])
}

export default AllRoutes;