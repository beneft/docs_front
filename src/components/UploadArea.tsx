import React, { useState, useRef } from 'react';
import './UploadArea.css';

const UploadArea: React.FC<{ onUpload: (file: File, url: string, fileType: string) => void }> = ({ onUpload }) => {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [fileType, setFileType] = useState<string | null>(null);

    const handleFile = (file: File) => {
        const url = URL.createObjectURL(file);
        const extension = file.name.split('.').pop()?.toLowerCase();
        const mime =
            file.type ||
            (extension === 'pdf' ? 'application/pdf' :
                extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                    extension === 'doc' ? 'application/msword' : '');

        setFileUrl(url);
        setFileType(mime);
        onUpload(file, url, mime);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const reset = () => {
        if (fileUrl) {
            URL.revokeObjectURL(fileUrl);
        }
        setFileUrl(null);
        setFileType(null);
    };

    return (
        <div className="upload-wrapper">
            {!fileUrl ? (
                <div
                    className={`upload-area ${dragging ? 'dragging' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleClick}
                >
                    <p className="upload-icon">📤</p>
                    <p className="upload-text">Upload a file</p>
                    <p>Drag and drop your document here</p>
                    <p>or click to upload</p>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleChange}
                    />
                </div>
            ) : (
                <div className="preview-container">
                    <div className="preview-toolbar">
                        <button onClick={reset}>Clear</button>
                        <label>
                            <button onClick={handleClick}>Reselect</button>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleChange}
                            />
                        </label>
                    </div>
                    {fileType && fileUrl && fileType === 'application/pdf' ? (
                        <iframe src={fileUrl} className="preview-frame" title="Preview" />
                    ) : (
                        <div className="preview-message">
                            <p>Preview not available for this file type.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UploadArea;