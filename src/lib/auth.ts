export interface User {
    id: string;
    username: string;
    name: string;
}

const DEFAULT_PASSWORD = 'ssh12345';

// Default users
const DEFAULT_USERS: User[] = [
    { id: 'user_01', username: 'Sun', name: 'Sun' },
    { id: 'user_02', username: 'Jiang', name: 'Jiang' },
    { id: 'user_03', username: 'Zhang', name: 'Zhang' },
    { id: 'user_04', username: 'Xu', name: 'Xu' },
    { id: 'user_05', username: 'Lii', name: 'Lii' },
];

const AUTH_KEY = 'nexus_auth_user';
const USERS_KEY = 'nexus_users';

// Get all users (default + custom added)
export function getUsers(): User[] {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return DEFAULT_USERS;
        }
    }
    return DEFAULT_USERS;
}

// For backward compatibility (used in dashboard)
export const USERS = typeof window !== 'undefined' ? getUsers() : DEFAULT_USERS;

// Add a new user
export function addUser(username: string): User {
    const users = getUsers();
    const id = `user_${String(users.length + 1).padStart(2, '0')}`;
    const newUser: User = { id, username, name: username };
    const updated = [...users, newUser];
    if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    }
    return newUser;
}

export function login(username: string, password: string): User | null {
    if (password !== DEFAULT_PASSWORD) return null;
    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        }
        return user;
    }
    return null;
}

export function logout() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_KEY);
    }
}

export function getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
}
