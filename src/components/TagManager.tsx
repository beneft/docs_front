import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

interface TagManagerProps {
    userId: string | null;
    documentId: string | null;
    token: string | null;
    onSelectedTagsChange?: (tags: string[]) => void;
}

const TagManager: React.FC<TagManagerProps> = ({ userId, documentId, token, onSelectedTagsChange }) => {
    const [allTags, setAllTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const { t } = useTranslation('tagmanager');

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const res = await fetch(`http://localhost:8082/tags/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch tags');
            const data = await res.json();
            setAllTags(data);
        } catch (err) {
            console.error('Error fetching tags:', err);
        }
    };

    const addTag = async () => {
        if (!newTag.trim()) return;
        await fetch(`http://localhost:8082/tags/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newTag.trim().replace(/^"+|"+$/g, ''))
        });
        setNewTag('');
        fetchTags();
    };

    const deleteTag = async (tag: string) => {
        if (!window.confirm(`Delete tag "${tag}"?`)) return;
        await fetch(`http://localhost:8082/tags/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(tag.replace(/^"+|"+$/g, ''))
        });
        setSelectedTags((prev) => prev.filter(t => t !== tag));
        onSelectedTagsChange?.(selectedTags);
        fetchTags();
    };

    const toggleTagSelection = (tag: string) => {
        const updated = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];
        setSelectedTags(updated);
        onSelectedTagsChange?.(updated);
    };

    return (
        <div>
            <label className="section-label">{t('tag-title')}:</label>
            <div className="tags-container" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '120px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '6px'
            }}>
                {allTags?.map(tag => (
                    <div
                        key={tag}
                        onClick={() => toggleTagSelection(tag)}
                        style={{
                            backgroundColor: selectedTags.includes(tag) ? '#007bff' : '#eee',
                            color: selectedTags.includes(tag) ? '#fff' : '#333',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <span>{tag}</span>
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteTag(tag);
                            }}
                            style={{
                                marginLeft: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            ×
                        </span>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '8px' }}>
                <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={t('new-tag')}
                />
                <button onClick={addTag} style={{ marginLeft: '6px' }}>
                    {t('add-btn')}
                </button>
            </div>
        </div>
    );
};

export default TagManager;