import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import './WordPreview.css';

interface WordPreviewProps {
    fileUrl: string;
    full: boolean;
}

const WordPreview: React.FC<WordPreviewProps> = ({ fileUrl, full }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        fetch(fileUrl)
            .then(res => res.arrayBuffer())
            .then(async (arrayBuffer) => {
                containerRef.current!.innerHTML = ''; // clear previous content
                try {
                    await renderAsync(arrayBuffer, containerRef.current!);
                    // Adjust container height to content height if needed
                    const height = containerRef.current!.getBoundingClientRect().height;
                    containerRef.current!.style.height = `${height}px`;
                } catch (e) {
                    console.error('docx-preview error:', e);
                    setError('Preview failed');
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setError('Preview failed');
            });
    }, [fileUrl]);

    return (
        <div className={`word-preview${full ? ' word-preview-full' : ''}`}>
            {error ? <div className="doc-placeholder">{error}</div> : <div ref={containerRef} />}
        </div>
    );
};

export default WordPreview;