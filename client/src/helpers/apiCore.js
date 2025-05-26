import axios from "axios";

const API_URL = `http://localhost:3001/api`; 
const AUTH_SESSION_KEY = "authToken";

const getTokenFromStorage = () => {
    return localStorage.getItem(AUTH_SESSION_KEY);
};

const axiosInstance = axios.create({
    baseURL: API_URL, 
    headers: {
        "Content-Type": "application/json" 
    }
});

// Add a request interceptor to add the auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getTokenFromStorage();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(AUTH_SESSION_KEY);
        }
        return Promise.reject(error);
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

    downloadFile = (url, config = {}) => {
        return axiosInstance.get(url, {
            ...config,
            responseType: 'blob',
            headers: {
                ...config.headers,
                'Accept': 'application/pdf,application/octet-stream'
            }
        });
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

    