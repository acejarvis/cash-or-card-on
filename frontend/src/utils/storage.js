// Storage utility to allow multiple users logged in simultaneously across tabs
// Uses sessionStorage instead of localStorage for tab-isolated sessions

const AUTH_TOKEN_KEY = 'auth_token';

export const storage = {
    // Get auth token from sessionStorage
    getToken: () => {
        return sessionStorage.getItem(AUTH_TOKEN_KEY);
    },

    // Set auth token in sessionStorage
    setToken: (token) => {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    },

    // Remove auth token from sessionStorage
    removeToken: () => {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
    },

    // Clear all session storage
    clear: () => {
        sessionStorage.clear();
    }
};
