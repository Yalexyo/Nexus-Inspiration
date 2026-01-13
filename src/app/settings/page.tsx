'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTimes, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import styles from './settings.module.css';

const DEFAULT_TAGS = ['Design', 'Development', 'Product', 'Business', 'Life'];

export default function SettingsPage() {
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        // Load existing tags or set defaults
        const stored = localStorage.getItem('nexus_user_tags');
        if (stored) {
            setTags(JSON.parse(stored));
        } else {
            setTags(DEFAULT_TAGS);
            localStorage.setItem('nexus_user_tags', JSON.stringify(DEFAULT_TAGS));
        }
    }, []);

    const addTag = () => {
        if (newTag && !tags.includes(newTag)) {
            const updated = [...tags, newTag];
            setTags(updated);
            localStorage.setItem('nexus_user_tags', JSON.stringify(updated));
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        const updated = tags.filter(t => t !== tag);
        setTags(updated);
        localStorage.setItem('nexus_user_tags', JSON.stringify(updated));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/dashboard" className={styles.backLink}>
                    <FaArrowLeft /> Back to Dashboard
                </Link>
                <h1 className={styles.title}>Settings</h1>
            </header>

            <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Tag Management</h2>
                <p className={styles.description}>
                    These tags help the AI organize your content. Adding more specific tags improves the auto-categorization accuracy.
                </p>

                <div className={styles.inputGroup}>
                    <input
                        className={styles.input}
                        placeholder="Add a new tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <button className={styles.addBtn} onClick={addTag}>
                        <FaPlus />
                    </button>
                </div>

                <div className={styles.tagList}>
                    {tags.map(tag => (
                        <span key={tag} className={styles.tag}>
                            {tag}
                            <button className={styles.removeBtn} onClick={() => removeTag(tag)}>
                                <FaTimes />
                            </button>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
