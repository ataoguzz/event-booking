import {useState} from "react";
import {APICore} from "@/helpers/apiCore.js";

// helpers

export default function useResetPassword() {

    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const resetPassword = async (newPassword, token, userId) => {
        const api = new APICore();

        try {
            await api.post("api/auth/reset-password", {newPassword, token, userId});
            setSuccess(true);
        } catch (error) {
            setError(error.message);
        }
    };

    return [success, error, resetPassword];
}
