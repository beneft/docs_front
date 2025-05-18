import React, { useState } from 'react';
import UploadArea from '../components/UploadArea';
import '../styles/Profile.css';
import '../styles/Verify.css';

const Verify: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [docType, setDocType] = useState<string | null>(null);
    const [verifyResult, setVerifyResult] = useState<any[] | null>(null);

    const handleUpload = (file: File, url: string, docType: string) => {
        setFile(file);
        setPreviewUrl(url);
        setDocType(docType);
    };

    const handleVerify = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await fetch('http://localhost:8083/verify', {
                method: 'POST',
                body: formData
            });

            // Simulate verification result
            setVerifyResult([
                { name: "Alice Johnson", date: "2024-08-01", certificate: "Valid", reason: "Approved" },
                { name: "Bob Smith", date: "2024-08-02", certificate: "Valid", reason: "Reviewed" }
            ]);
        } catch (error) {
            alert('Verification failed.');
            setVerifyResult([
                { name: "Alice Johnson", date: "2024-08-01", certificate: "Valid", reason: "Approved" },
                { name: "Bob Smith", date: "2024-08-02", certificate: "Valid", reason: "Reviewed" }
            ]);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreviewUrl(null);
        setVerifyResult(null);
        setDocType(null);
    };

    return (
        <div className="profile-page">
            <div className="profile-nav profile-nav-verify">
                <div className="nav-logo">DocFlow</div>
                <a className="back-button" href="/">← Back</a>
                {!verifyResult ? (
                    <>
                        <h2>Verify a Document</h2>
                        <p className="instructions">
                            Upload a signed document to verify its signatures and certificates.
                        </p>
                        {file && (
                            <div className="verify-button">
                            <p>You have uploaded a document "{file.name}".</p>
                            <button className="verify-verify" onClick={handleVerify}>Verify</button>
                                <button className="verify-clear" onClick={handleClear}>Clear</button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <h2>Verification Results</h2>
                        <ul className="verify-signer-list">
                            {verifyResult.map((sig, index) => (
                                <li key={index} className="verify-signer-item verified">
                                    <strong>{sig.name}</strong><br />
                                    Signed: {sig.date}<br />
                                    Certificate: {sig.certificate}<br />
                                    Reason: {sig.reason}
                                </li>
                            ))}
                        </ul>
                        <button onClick={handleClear} className="verify-clear">Clear</button>
                    </>
                )}
            </div>
            <div className="profile-content">
                {previewUrl ? (
                    docType === 'application/pdf' ? (
                        <iframe src={previewUrl} title="Preview" className="preview-frame" />
                    ) : (
                        <div className="preview-message">
                            <p>Preview not available for this file type.</p>
                        </div>
                    )
                ) : (
                    <UploadArea onUpload={handleUpload} />
                )}
            </div>
        </div>
    );
};

export default Verify;