'use client';

import { useState } from 'react';
import styles from './login.module.css';
import { loginAction } from '../actions';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Nexus</h1>
                    <p className={styles.subtitle}>Enter the Inspiration Engine</p>
                </div>

                <form className={styles.form} action={async (formData) => {
                    setIsLoading(true);
                    await loginAction(formData);
                }}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="username">Identity</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className={styles.input}
                            placeholder="Your Name"
                            required
                            autoComplete="off"
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={isLoading}>
                        {isLoading ? 'Accessing...' : 'Enter System'}
                    </button>
                </form>
            </div>
        </div>
    );
}
