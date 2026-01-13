import { cookies } from 'next/headers';

// Mock Auth Service
// In a real app, this would verify credentials against a DB
// For v1.0, we just set a session cookie

const SESSION_COOKIE_NAME = 'nexus_session';

export async function login(username: string) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Set cookie
    (await cookies()).set(SESSION_COOKIE_NAME, JSON.stringify({ username, role: 'user' }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    return true;
}

export async function logout() {
    (await cookies()).delete(SESSION_COOKIE_NAME);
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    if (!session) return null;
    try {
        return JSON.parse(session.value);
    } catch {
        return null;
    }
}
