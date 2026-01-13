'use server';

import { login, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string;

    if (username) {
        await login(username);
        redirect('/dashboard');
    }
}

export async function logoutAction() {
    await logout();
    redirect('/auth/login');
}
