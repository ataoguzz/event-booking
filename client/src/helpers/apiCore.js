import {jwtDecode} from "jwt-decode";
import axios from "axios";

const API_URL = `http://localhost:3001`; // süpheli

const axiosInstance = axios.create({
    baseURL: `${API_URL}`,
    headers: {
        "Content-Type": "application/json"
    }
});

axiosInstance.interceptors.request.use(
    config => {
        const token = getTokenFromStorage();
        if (token) {
            config.headers["Authorization"] = "Bearer " + token;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// intercepting to capture errors
axiosInstance.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error && error.response) {
            const { status, data } = error.response;
            let message;
            switch (status) {
                case 401:
                    message = "Invalid credentials, please check your email/password!";
                    break;
                case 403:
                    message = "Access Forbidden";
                    break;
                case 404:
                    message = "Sorry! The data you are looking for could not be found.";
                    break;
                default:
                    message = data?.message || error.message || "An unknown error occurred.";
            }

            // Create a custom error object to propagate
            const customError = {
                status,
                message,
                data,
                originalError: error,
            };

            return Promise.reject(customError); // Reject with the custom error
        }

        // For cases where there's no response (e.g., network issues)
        return Promise.reject({
            message: error.message || "Network Error",
            originalError: error,
        });
    }
);

const AUTH_SESSION_KEY = "authToken";

const setAuthorization = (token) => {
    if (token) axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + token;
    else delete axiosInstance.defaults.headers.common["Authorization"];
};

const getTokenFromStorage = () => {
    const token = localStorage.getItem(AUTH_SESSION_KEY);
    return token ? token : null;
};

class APICore {

    /**
     * Fetches data from given url
     */
    get = (url, params) => {
        let response;
        if (params) {
            var queryString = params
                ? Object.keys(params)
                    .map(key => key + "=" + params[key])
                    .join("&")
                : "";
            response = axiosInstance.get(`${url}?${queryString}`, params);
        } else {
            response = axiosInstance.get(`${url}`, params);
        }
        return response;
    };

    /**
     * post given data to url
     */
    post = (url, data, config = {}) => {
        // If data is FormData, don't set Content-Type header at all
        if (data instanceof FormData) {
            const token = getTokenFromStorage();
            console.log('Token for request:', token);
            
            // Let the browser set the Content-Type with boundary
            delete axiosInstance.defaults.headers['Content-Type'];
            
            const requestConfig = {
                ...config,
                headers: {
                    ...config.headers,
                    'Authorization': token ? `Bearer ${token}` : undefined
                }
            };
            
            console.log('Request config:', requestConfig);
            return axiosInstance.post(url, data, requestConfig);
        }
        
        // Reset Content-Type for non-FormData requests
        axiosInstance.defaults.headers['Content-Type'] = 'application/json';
        return axiosInstance.post(url, data, config);
    };

    /**
     * Updates data
     */
    put = (url, data) => {
        return axiosInstance.put(url, data);
    };

    /**
     * Deletes data
     */
    delete = (url, data) => {
        return axiosInstance.delete(url, data);
    };

    isUserAuthenticated = () => {
        const token = getTokenFromStorage();
        if (!token) {
            return false;
        }
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
            console.warn("access token expired");
            return false;
        } else {
            return true;
        }
    };

    getUserData = (userId) => {
        return axiosInstance.get(`/api/user/${userId}`);
    };

    storeToken = (token) => {
        if (token) {
            localStorage.setItem(AUTH_SESSION_KEY, token);
        }
        else {
            localStorage.removeItem(AUTH_SESSION_KEY);
        }
    };
}

export {APICore, setAuthorization};


