import {useEffect} from "react";
import {Navigate} from "react-router-dom";

import useDeleteAccount from "@/hooks/auth/useDeleteAccount.js";

const DeleteAccount = () => {

    const {deleteAccount} = useDeleteAccount()

    useEffect(() => {
        deleteAccount()
    }, [deleteAccount]);

    return <>{<Navigate to="/auth/login" replace />}</>;
};

export default DeleteAccount;