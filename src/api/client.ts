import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://ragnostic-backend-469683750719.europe-north2.run.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token in all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 unauthorized errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear authentication data
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
