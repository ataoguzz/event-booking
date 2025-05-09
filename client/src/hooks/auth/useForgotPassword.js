import {useState} from "react";
import {APICore} from "@/helpers/apiCore.js";

// helpers

export default function useForgotPassword() {

    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const forgotPassword = async (email) => {
        const api = new APICore();
        try {
            await api.post("api/auth/forgot-password", {email: email})
            setSuccess(true);
        } catch (error) {
            setError(error.message);
        }
    };

    return [success, error, forgotPassword];
}