import { NavPage, UserAccount, UserRole } from '../types';

const USERS_STORAGE_KEY = 'baghewala_users_v1';
const SESSION_STORAGE_KEY = 'baghewala_session_v1';

// Seeded realistic industrial users
const SEEDED_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    username: 'admin',
    name: 'Vikramaditya Sharma',
    role: 'Administrator',
    status: 'Active',
    lastLogin: '2026-09-27 10:14',
    email: 'v.sharma@baghewala-ops.in',
    avatarInitials: 'VS',
    password: 'admin123',
  },
  {
    id: 'usr-2',
    username: 'field.engineer',
    name: 'Rajendra Rathore',
    role: 'Field Engineer',
    status: 'Active',
    lastLogin: '2026-09-27 08:30',
    email: 'r.rathore@baghewala-ops.in',
    avatarInitials: 'RR',
    password: 'field123',
  },
  {
    id: 'usr-3',
    username: 'production.engineer',
    name: 'Ananya Mehta',
    role: 'Production Engineer',
    status: 'Active',
    lastLogin: '2026-09-26 17:45',
    email: 'a.mehta@baghewala-ops.in',
    avatarInitials: 'AM',
    password: 'production123',
  },
  {
    id: 'usr-4',
    username: 'maintenance.engineer',
    name: 'Sunil Choudhary',
    role: 'Maintenance Engineer',
    status: 'Active',
    lastLogin: '2026-09-27 06:15',
    email: 's.choudhary@baghewala-ops.in',
    avatarInitials: 'SC',
    password: 'maintenance123',
  },
  {
    id: 'usr-5',
    username: 'viewer',
    name: 'Deepak Verma',
    role: 'Viewer',
    status: 'Active',
    lastLogin: '2026-09-25 14:02',
    email: 'd.verma@baghewala-ops.in',
    avatarInitials: 'DV',
    password: 'viewer123',
  },
];

/**
 * Initializes and retrieves users from localStorage.
 */
export function getAllUsers(): UserAccount[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEEDED_USERS));
      return SEEDED_USERS;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error('Failed to read users from localStorage:', err);
    return SEEDED_USERS;
  }
}

/**
 * Saves users list to localStorage.
 */
function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist users to localStorage:', err);
  }
}

/**
 * Authenticates user credentials against the client-side user store.
 */
export function login(
  usernameInput: string,
  passwordInput: string,
  rememberMe: boolean = true
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const users = getAllUsers();

  const user = users.find(u => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    return { success: false, error: 'Invalid username or password.' };
  }

  if (user.password !== passwordInput) {
    return { success: false, error: 'Invalid username or password.' };
  }

  if (user.status === 'Disabled') {
    return {
      success: false,
      error: 'This account has been deactivated. Please contact your Operations Administrator.',
    };
  }

  // Update last login timestamp
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
  user.lastLogin = nowStr;
  saveUsers(users);

  // Strip password before session storage
  const sessionUser: UserAccount = {
    ...user,
    password: '',
  };

  const serialized = JSON.stringify(sessionUser);
  if (rememberMe) {
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return { success: true, user: sessionUser };
}

/**
 * Clears current session from both localStorage and sessionStorage.
 */
export function logout(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Retrieves the currently logged-in user, if any.
 */
export function getCurrentSession(): UserAccount | null {
  try {
    const local = localStorage.getItem(SESSION_STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
    }
    const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (session) {
      return JSON.parse(session);
    }
    return null;
  } catch (err) {
    console.error('Failed to parse current session:', err);
    return null;
  }
}

/**
 * Role-Based Access Control matrix.
 */
export function hasPageAccess(role: UserRole, page: NavPage): boolean {
  switch (role) {
    case 'Administrator':
      return true; // Full access to all routes

    case 'Field Engineer':
      return ['overview', 'twin', 'css', 'srp', 'integrated', 'risk', 'whatif', 'history', 'ai'].includes(page);

    case 'Production Engineer':
      return ['overview', 'twin', 'css', 'srp', 'integrated', 'risk', 'whatif', 'history', 'ai'].includes(page);

    case 'Maintenance Engineer':
      return ['overview', 'twin', 'srp', 'integrated', 'risk', 'history', 'ai'].includes(page);

    case 'Viewer':
      return ['overview', 'twin', 'history', 'ai'].includes(page);

    default:
      return false;
  }
}

/**
 * Returns authorized pages for a given role.
 */
export function getAuthorizedPages(role: UserRole): NavPage[] {
  const allPages: NavPage[] = [
    'overview',
    'twin',
    'css',
    'srp',
    'integrated',
    'risk',
    'whatif',
    'history',
    'ai',
    'users',
    'settings',
  ];
  return allPages.filter(p => hasPageAccess(role, p));
}

/**
 * Admin: Add a new user.
 */
export function createUser(userData: {
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  email?: string;
}): UserAccount {
  const users = getAllUsers();
  const cleanUsername = userData.username.trim().toLowerCase();

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    throw new Error(`Username "${userData.username}" is already in use.`);
  }

  const initials = userData.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'U';

  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    name: userData.name.trim(),
    role: userData.role,
    status: 'Active',
    lastLogin: 'Never',
    email: userData.email?.trim() || `${cleanUsername}@baghewala-ops.in`,
    avatarInitials: initials,
    password: userData.password || 'welcome123',
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

/**
 * Admin: Update existing user.
 */
export function updateUser(id: string, updates: Partial<UserAccount>): UserAccount {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    throw new Error('User not found.');
  }

  // Update initials if name changed
  let avatarInitials = users[idx].avatarInitials;
  if (updates.name && updates.name !== users[idx].name) {
    avatarInitials = updates.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || 'U';
  }

  users[idx] = {
    ...users[idx],
    ...updates,
    avatarInitials,
  };

  saveUsers(users);

  // If currently active user was updated, update session too
  const current = getCurrentSession();
  if (current && current.id === id) {
    const updatedSession = { ...users[idx], password: '' };
    if (localStorage.getItem(SESSION_STORAGE_KEY)) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    }
  }

  return users[idx];
}

/**
 * Admin: Delete a user.
 */
export function deleteUser(id: string): boolean {
  const users = getAllUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}

/**
 * Admin: Toggle user active / disabled status.
 */
export function toggleUserStatus(id: string): UserAccount {
  const users = getAllUsers();
  const user = users.find(u => u.id === id);
  if (!user) throw new Error('User not found.');
  user.status = user.status === 'Active' ? 'Disabled' : 'Active';
  saveUsers(users);
  return user;
}

/**
 * Admin: Reset user's password.
 */
export function resetPassword(id: string, newPass: string): boolean {
  const users = getAllUsers();
  const user = users.find(u => u.id === id);
  if (!user) return false;
  user.password = newPass;
  saveUsers(users);
  return true;
}
