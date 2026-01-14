export interface User {
    id: string;
    username: string;
    name: string;
    avatar: string;
}

// Hardcoded Users
export const USERS: User[] = [
    { id: 'user_01', username: 'alex', name: 'Alex Creator', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 'user_02', username: 'sarah', name: 'Sarah Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'user_03', username: 'mike', name: 'Mike Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    { id: 'user_04', username: 'emily', name: 'Emily Product', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
    { id: 'user_05', username: 'david', name: 'David Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 'god', username: 'god', name: 'God Mode', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=God' },
];

const AUTH_KEY = 'nexus_auth_user';

export function login(username: string): User | null {
    const user = USERS.find(u => u.username === username.toLowerCase());
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
