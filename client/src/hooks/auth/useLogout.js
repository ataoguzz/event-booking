import {APICore} from "@/helpers/apiCore.js";
import {useAuth} from "../../contexts/AuthContext";
import {setAuthorization} from "@/helpers/apiCore.js";

export default function useLogout() {
    const {setUser} = useAuth();
    const api = new APICore();

    const logout = () => {
        setUser(undefined);
        setAuthorization(null);
        api.storeToken(null);
    };

    return {logout};
}