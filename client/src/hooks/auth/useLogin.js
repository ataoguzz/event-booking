import {useState} from "react";
import {APICore, setAuthorization} from "@/helpers/apiCore.js";
import {useAuth} from "../../contexts/AuthContext";

export default function useLogin() {
    const {user, setUser} = useAuth();
    const [error, setError] = useState();

    const api = new APICore();

    const login = async ({email, password}) => {
        try {
            const path = "/api/auth/login";
            const response = await api.post(`${path}`, {email, password});
            setUser(response.data.user);
            api.storeToken(response.data.token);
            setAuthorization(response.data.token);
        } catch (error) {
            setError(error.message);
        }
    };

    return {user, error, login};
}