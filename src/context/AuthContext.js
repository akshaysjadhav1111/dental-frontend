import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [doctor, setDoctor] = useState(
    JSON.parse(localStorage.getItem('doctor') || 'null')
  );

  const login = (tokenValue, doctorData) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('doctor', JSON.stringify(doctorData));
    setToken(tokenValue);
    setDoctor(doctorData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('doctor');
    setToken(null);
    setDoctor(null);
  };

  return (
    <AuthContext.Provider value={{ token, doctor, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}