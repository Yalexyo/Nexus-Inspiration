'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaMagic, FaTimes, FaLink, FaImage } from 'react-icons/fa';
import styles from './capture.module.css';
import { getAiSuggestions } from './actions';
import { saveInspiration } from '@/lib/storage';

export default function CapturePage() {
    const router = useRouter();

    // Form State
    const [description, setDescription] = useState('');
    const [mediaType, setMediaType] = useState<'url' | 'upload'>('url');
    const [mediaContent, setMediaContent] = useState('');
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Settings
    const [predefinedTags, setPredefinedTags] = useState<string[]>([]);

    // UI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [hasAiRun, setHasAiRun] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('nexus_user_tags');
        if (stored) {
            try {
                setPredefinedTags(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse tags", e);
            }
        }
    }, []);

    const handleBlurDescription = async () => {
        if (!description.trim() || description.length < 5 || isAiLoading) return;

        setIsAiLoading(true);
        const result = await getAiSuggestions(description, predefinedTags);
        setIsAiLoading(false);

        if (result.success && result.data) {
            setTitle(result.data.title);
            const newTags = [result.data.primary_tag, result.data.secondary_tag].filter(Boolean);
            // Merge unique
            setTags(prev => Array.from(new Set([...prev, ...newTags])));
            setHasAiRun(true);
        }
    };

    const handleSave = async () => {
        if (!title || !description) return;
        setIsSaving(true);

        // Simulate network delay for UX
        await new Promise(r => setTimeout(r, 600));

        saveInspiration({
            title,
            description,
            mediaType,
            mediaContent, // For upload, ideally we convert to Base64 or upload to S3. For MVP, we assume URL or Base64 is stored here.
            tags
        });

        router.push('/dashboard');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaContent(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Capture Inspiration</h1>
                <p className={styles.subtitle}>Let AI structure your chaotic thoughts.</p>
            </header>

            <div className={styles.card}>
                {isSaving && <div className={styles.loadingOverlay}>Saving...</div>}

                {/* Media Section */}
                <div className={styles.section}>
                    <div className={styles.label}>
                        <span>Source</span>
                        <div className={styles.mediaToggle}>
                            <button
                                className={`${styles.toggleBtn} ${mediaType === 'url' ? styles.active : ''}`}
                                onClick={() => setMediaType('url')}
                            >
                                <FaLink /> URL
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${mediaType === 'upload' ? styles.active : ''}`}
                                onClick={() => setMediaType('upload')}
                            >
                                <FaImage /> Upload
                            </button>
                        </div>
                    </div>

                    {mediaType === 'url' ? (
                        <input
                            className={styles.input}
                            placeholder="https://example.com/interesting-article"
                            value={mediaContent}
                            onChange={(e) => setMediaContent(e.target.value)}
                        />
                    ) : (
                        <input
                            type="file"
                            className={styles.input}
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    )}
                </div>

                {/* User Description */}
                <div className={styles.section}>
                    <label className={styles.label}>My Thoughts</label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Type your thoughts here... AI will analyze this when you click away."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleBlurDescription}
                    />
                </div>

                {/* AI Results Section */}
                <div className={styles.aiSection}>
                    <div className={styles.aiBadge}>
                        <FaMagic /> {isAiLoading ? 'Analyzing...' : 'AI Enhanced'}
                    </div>

                    <div className={styles.row}>
                        <div className={`${styles.col} ${styles.section}`}>
                            <label className={styles.label}>Title</label>
                            <input
                                className={styles.input}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Waiting for AI..."
                            />
                        </div>

                        <div className={`${styles.col} ${styles.section}`}>
                            <label className={styles.label}>Tags</label>
                            <div className={styles.tagInput}>
                                {tags.map(tag => (
                                    <span key={tag} className={styles.tag}>
                                        #{tag}
                                        <FaTimes
                                            className={styles.tagRemove}
                                            size={10}
                                            onClick={() => setTags(tags.filter(t => t !== tag))}
                                        />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={!title || !description || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save to Nexus'}
                    </button>
                </div>

            </div>
        </div>
    );
}
