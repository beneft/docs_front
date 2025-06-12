import React, { useEffect, useState } from 'react';

interface TagFilterProps {
    userId: string;
    token: string | null;
    onChange: (selectedTags: string[]) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ userId, token, onChange }) => {
    const [tags, setTags] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await fetch(`http://localhost:8082/tags/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch tags');
                const data = await res.json();
                setTags(data);
            } catch (err) {
                console.error('Error fetching tags:', err);
            }
        };
        fetchTags();
    }, [userId, token]);

    const toggleTag = (tag: string) => {
        const updated = selected.includes(tag)
            ? selected.filter(t => t !== tag)
            : [...selected, tag];
        setSelected(updated);
        onChange(updated);
    };

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            maxHeight: '120px',
            overflowY: 'auto'
        }}>
            {tags.map(tag => (
                <div
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                        backgroundColor: selected.includes(tag) ? '#007bff' : '#eee',
                        color: selected.includes(tag) ? '#fff' : '#333',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    {tag}
                </div>
            ))}
        </div>
    );
};

export default TagFilter;
