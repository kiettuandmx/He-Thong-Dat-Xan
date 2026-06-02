import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Khi load lại trang, kiểm tra localStorage xem đã login chưa
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const updateUser = (nextUserData) => {
        setUser((currentUser) => {
            const baseUser = currentUser || {};
            const mergedUser = {
                ...baseUser,
                ...nextUserData,
                user: {
                    ...(baseUser.user || {}),
                    ...(nextUserData.user || {}),
                },
            };

            localStorage.setItem('user', JSON.stringify(mergedUser));
            return mergedUser;
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, updateUser, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Hook tùy chỉnh để sử dụng Context nhanh hơn
export const useAuth = () => useContext(AuthContext);
