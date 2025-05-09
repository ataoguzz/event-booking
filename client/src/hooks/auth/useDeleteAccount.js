import {APICore} from "@/helpers/apiCore.js";
import {useAuth} from "../../contexts/AuthContext";
import {setAuthorization} from "@/helpers/apiCore.js";


export default function useDeleteAccount() {
    const {user, setUser} = useAuth();
    const api = new APICore();

    const deleteAccount = async () => {
        const path = `/api/user/${user.userId}`
        await api.delete(`${path}`)
        setUser(undefined)
        setAuthorization(null)
        api.storeToken(null)
    };

    return {deleteAccount};
}