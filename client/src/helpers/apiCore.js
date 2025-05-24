import axios from "axios";

const API_URL = `http://localhost:3001/api`; 

const axiosInstance = axios.create({
    baseURL: API_URL, 
    headers: {
        "Content-Type": "application/json" 
    }
});

const AUTH_SESSION_KEY = "authToken";

const getTokenFromStorage = () => {
    return localStorage.getItem(AUTH_SESSION_KEY);
};

axiosInstance.interceptors.request.use(
    config => {
        const token = getTokenFromStorage();
        if (token) {
            config.headers["Authorization"] = "Bearer " + token;
        }
        
        // If we're sending FormData, let the browser set the Content-Type
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }
        
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        const customError = {
            status: error.response?.status,
            message: "An error occurred",
            data: error.response?.data,
            originalError: error,
        };

        if (error.response) {
            const { status, data } = error.response;
            switch (status) {
                case 401:
                    customError.message = data?.message || "Authentication failed. Please check your credentials or token.";
                    // Clear expired/invalid token
                    localStorage.removeItem(AUTH_SESSION_KEY);
                    break;
                case 403:
                    customError.message = data?.message || "Access Forbidden: You do not have permission to access this resource.";
                    break;
                case 404:
                    customError.message = data?.message || "Resource not found.";
                    break;
                default:
                    customError.message = data?.message || error.message || "An unknown server error occurred.";
            }
        } else if (error.request) {
            customError.message = "Network Error: Could not connect to the server.";
        } else {
            customError.message = error.message || "An unexpected error occurred.";
        }
        return Promise.reject(customError);
    }
);

class apiClient {
    get = (url, params) => {
        return axiosInstance.get(url, { params: params });
    };

    post = (url, data, config = {}) => {
        return axiosInstance.post(url, data, config);
    };

    put = (url, data, config = {}) => {
        return axiosInstance.put(url, data, config);
    };

    delete = (url, config = {}) => {
        return axiosInstance.delete(url, config);
    };

    storeToken = (token) => {
        if (token) {
            localStorage.setItem(AUTH_SESSION_KEY, token);
        } else {
            localStorage.removeItem(AUTH_SESSION_KEY);
        }
    };

    getStoredToken = () => {
        return getTokenFromStorage();
    };
}

export default new apiClient(); 

    