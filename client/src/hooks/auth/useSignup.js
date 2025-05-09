import {useState} from "react";
import {APICore} from "@/helpers/apiCore.js";
import {useAuth} from "@/contexts/AuthContext.jsx";
import {setAuthorization} from "@/helpers/apiCore.js";

export default function useSignup() {
    const {user, setUser} = useAuth();
    const [error, setError] = useState();
    const api = new APICore();

    const signup = async ({first_name, last_name, email, password, school, city, priorityScore, role}) => {
        try {
            const path = "/api/auth/signup";
            const response = await api.post(`${path}`, {first_name, last_name, email, password, school, city, priorityScore, role});
            setUser(response.data.user);
            setAuthorization(response.data.token);
        } catch (error) {
            setError(error.message);
        }
    };

    return {user, error, signup};
}