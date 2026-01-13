'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaSearch, FaTimes, FaCube } from 'react-icons/fa';
import styles from './dashboard.module.css';
import { getInspirations, Inspiration, deleteInspiration } from '@/lib/storage';
import { logoutAction } from '../auth/actions';

export default function DashboardPage() {
    const router = useRouter();
    const [inspirations, setInspirations] = useState<Inspiration[]>([]);
    const [filtered, setFiltered] = useState<Inspiration[]>([]);
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<Inspiration | null>(null);

    // Load Data
    useEffect(() => {
        const data = getInspirations();
        setInspirations(data);
        setFiltered(data);
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = inspirations;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.tags.some(t => t.toLowerCase().includes(q))
            );
        }
        setFiltered(result);
    }, [search, inspirations]);

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this inspiration?')) {
            deleteInspiration(id);
            setInspirations(prev => prev.filter(i => i.id !== id));
            setSelectedItem(null);
        }
    };

    const handleLogout = async () => {
        // We need to call a server action or API to clear the cookie.
        // Wait, `logout` from `@/lib/auth` is server-side (cookies).
        // I need a Server Action wrapper for logout too.
        // I can put it in `/auth/actions.ts`.
        // For now, I'll validly assume I need to create it.
        // Instead of importing `logout`, I'll create `logoutAction` in `actions.ts`
        // and call it here.

        // Quick fix: create separate file call or just do it.
        await fetch('/api/auth/logout', { method: 'POST' }); // Oops, I didn't make an API.
        // Let's use `document.cookie` clearing as a fallback? No, httpOnly.
        // I'll create a server action in a bit. 
        // Actually, I can just redirect to `/auth/login` and let the user re-login? 
        // No, security.
        // I'll add `logoutAction` to `src/app/auth/actions.ts` now.
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <FaCube className={styles.titleIcon} />
                    Nexus Dashboard
                </div>
                <div className={styles.headerActions}>
                    <Link href="/capture" className={`${styles.btn} ${styles.btnPrimary}`}>
                        <FaPlus /> Capture
                    </Link>
                    <Link href="/settings" className={styles.btn}>
                        Settings
                    </Link>
                    <form action={logoutAction}>
                        <button type="submit" className={styles.btn} style={{ border: 'none' }}>Sign Out</button>
                    </form>

                </div>
            </header>

            <div className={styles.toolbar}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <FaSearch style={{ position: 'absolute', left: 12, top: 10, color: '#666' }} />
                    <input
                        className={styles.searchInput}
                        style={{ paddingLeft: 36 }}
                        placeholder="Search titles or tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select className={styles.select}>
                    <option>Sort by Date (Newest)</option>
                    <option>Sort by Date (Oldest)</option>
                    <option>Sort by Title</option>
                </select>
            </div>

            <div className={styles.tableContainer}>
                {filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No inspirations found. Start capturing!</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Title</th>
                                <th className={styles.th}>Tags</th>
                                <th className={styles.th}>Created</th>
                                <th className={styles.th}>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => (
                                <tr key={item.id} className={styles.tr} onClick={() => setSelectedItem(item)}>
                                    <td className={styles.td}>
                                        <div className={styles.tdTitle}>{item.title}</div>
                                    </td>
                                    <td className={styles.td}>
                                        {item.tags.map(t => (
                                            <span key={t} className={styles.tag}>{t}</span>
                                        ))}
                                    </td>
                                    <td className={styles.td}>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className={styles.td}>
                                        {item.mediaType}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setSelectedItem(null)}>
                            <FaTimes size={20} />
                        </button>

                        <h2 className={styles.modalTitle}>{selectedItem.title}</h2>

                        <div className={styles.modalMeta}>
                            {selectedItem.tags.map(t => (
                                <span key={t} className={styles.tag}>{t}</span>
                            ))}
                            <span style={{ color: '#666' }}>
                                {new Date(selectedItem.createdAt).toLocaleString()}
                            </span>
                        </div>

                        <div className={styles.modalBody}>
                            {selectedItem.description}
                        </div>

                        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #333', display: 'flex', gap: 12 }}>
                            <a
                                href={selectedItem.mediaContent}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.btn}
                                style={{ fontSize: '0.875rem' }}
                            >
                                Open Source
                            </a>
                            <button
                                className={styles.btn}
                                style={{ color: '#EF4444', borderColor: '#EF4444' }}
                                onClick={() => handleDelete(selectedItem.id)}
                            >
                                Delete
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
