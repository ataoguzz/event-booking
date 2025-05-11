import {useEffect} from "react";
import {Navigate} from "react-router-dom";

import useLogout from "../../hooks/auth/useLogout";

const Logout = () => {

    const {logout} = useLogout();

    useEffect(() => {
        logout();
    }, [logout]);

    return <>{<Navigate to="/auth/login" replace />}</>;
};

export default Logout;