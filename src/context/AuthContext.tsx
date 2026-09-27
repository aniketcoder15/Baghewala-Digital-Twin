import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NavPage, UserAccount, UserRole } from '../types';
import * as authService from '../services/authService';

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  hasAccess: (page: NavPage) => boolean;
  users: UserAccount[];
  refreshUsers: () => void;
  addUser: (data: { username: string; name: string; role: UserRole; password?: string; email?: string }) => UserAccount;
  editUser: (id: string, updates: Partial<UserAccount>) => UserAccount;
  deleteUser: (id: string) => boolean;
  toggleStatus: (id: string) => UserAccount;
  changePassword: (id: string, newPass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserAccount[]>([]);

  const refreshUsers = useCallback(() => {
    const list = authService.getAllUsers();
    setUsers(list);
  }, []);

  useEffect(() => {
    const session = authService.getCurrentSession();
    setCurrentUser(session);
    refreshUsers();
    setIsLoading(false);
  }, [refreshUsers]);

  const login = useCallback(
    (username: string, password: string, rememberMe: boolean = true) => {
      const res = authService.login(username, password, rememberMe);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        refreshUsers();
      }
      return { success: res.success, error: res.error };
    },
    [refreshUsers]
  );

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  const hasAccess = useCallback(
    (page: NavPage): boolean => {
      if (!currentUser) return false;
      return authService.hasPageAccess(currentUser.role, page);
    },
    [currentUser]
  );

  const addUser = useCallback((data: { username: string; name: string; role: UserRole; password?: string; email?: string }) => {
    const newUser = authService.createUser(data);
    refreshUsers();
    return newUser;
  }, [refreshUsers]);

  const editUser = useCallback((id: string, updates: Partial<UserAccount>) => {
    const updated = authService.updateUser(id, updates);
    refreshUsers();
    const session = authService.getCurrentSession();
    if (session && session.id === id) {
      setCurrentUser(session);
    }
    return updated;
  }, [refreshUsers]);

  const deleteUser = useCallback((id: string) => {
    const res = authService.deleteUser(id);
    refreshUsers();
    return res;
  }, [refreshUsers]);

  const toggleStatus = useCallback((id: string) => {
    const res = authService.toggleUserStatus(id);
    refreshUsers();
    return res;
  }, [refreshUsers]);

  const changePassword = useCallback((id: string, newPass: string) => {
    const res = authService.resetPassword(id, newPass);
    refreshUsers();
    return res;
  }, [refreshUsers]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        hasAccess,
        users,
        refreshUsers,
        addUser,
        editUser,
        deleteUser,
        toggleStatus,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
