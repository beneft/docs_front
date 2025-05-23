import React, { useState } from 'react';
import UploadArea from '../components/UploadArea';
import '../styles/Profile.css';
import '../styles/Verify.css';
import WordPreview from "../components/WordPreview";

interface SignatureDTO {
    documentId: string;
    authorId: string;
    authorName: string;
    authorOrganization: string;
    signingDate: string; // ISO string from backend
    cmsValid: boolean;
}

interface CmsDetailsDTO {
    cmsValid: boolean;
    signatures: SignatureDTO[];
    uploaderId: string;
    createdDate: string;
}

const Verify: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [docType, setDocType] = useState<string | null>(null);
    const [verifyResult, setVerifyResult] = useState<CmsDetailsDTO | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = (file: File, url: string, docType: string) => {
        setFile(file);
        setPreviewUrl(url);
        setDocType(docType);
    };


    const handleVerify = async () => {
        setLoading(true);
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8083/verify', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Verification failed');

            const result = await response.json(); // CmsDetailsDTO
            setVerifyResult(result);
        } catch (error) {
            alert('Verification failed.');
            setVerifyResult(null);
        } finally {
            setLoading(false);
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
                {verifyResult && verifyResult.signatures ? (
                        <>
                            <h2>Verification Results</h2>
                            <ul className="verify-signer-list">
                                {verifyResult.signatures.map((sig: SignatureDTO, index: number) => (
                                    <li key={index} className={`verify-signer-item ${sig.cmsValid ? "verified" : "invalid"}`}>
                                        <strong>{sig.authorName}</strong><br />
                                        Signed: {new Date(sig.signingDate).toLocaleString()}<br />
                                        Organization: {sig.authorOrganization}<br />
                                        Certificate: {sig.cmsValid ? "Valid" : "Invalid"}
                                    </li>
                                ))}
                            </ul>
                            <p><strong>CMS Valid:</strong> {verifyResult.cmsValid ? "✅ Yes" : "❌ No"}</p>
                            <p><strong>Uploaded by User ID:</strong> {verifyResult.uploaderId}</p>
                            <p><strong>Upload Date:</strong> {new Date(verifyResult.createdDate).toLocaleString()}</p>
                            <button onClick={handleClear} className="verify-clear">Clear</button>
                        </>
                    ) : (<>
                    <h2>Verify a Document</h2>
                    <p className="instructions">
                        Upload a signed document to verify its signatures and certificates.
                    </p>
                    {file && (
                        <div className="verify-button">
                            <p>You have uploaded a document "{file.name}".</p>
                            <button className="verify-verify" onClick={handleVerify}>Verify{loading && <span className="spinner" />}</button>
                            <button className="verify-clear" onClick={handleClear}>Clear</button>
                        </div>
                    )}
                </>)}
                {/*{!verifyResult ? (*/}
                {/*    <>*/}
                {/*        <h2>Verify a Document</h2>*/}
                {/*        <p className="instructions">*/}
                {/*            Upload a signed document to verify its signatures and certificates.*/}
                {/*        </p>*/}
                {/*        {file && (*/}
                {/*            <div className="verify-button">*/}
                {/*                <p>You have uploaded a document "{file.name}".</p>*/}
                {/*                <button className="verify-verify" onClick={handleVerify}>Verify{loading && <span className="spinner" />}</button>*/}
                {/*                <button className="verify-clear" onClick={handleClear}>Clear</button>*/}
                {/*            </div>*/}
                {/*        )}*/}
                {/*    </>*/}
                {/*) : (*/}
                {/*    <>*/}
                {/*        <h2>Verification Results</h2>*/}
                {/*        <ul className="verify-signer-list">*/}
                {/*            {verifyResult.map((sig, index) => (*/}
                {/*                <li key={index} className="verify-signer-item verified">*/}
                {/*                    <strong>{sig.name}</strong><br />*/}
                {/*                    Signed: {sig.date}<br />*/}
                {/*                    Certificate: {sig.certificate}<br />*/}
                {/*                    Reason: {sig.reason}*/}
                {/*                </li>*/}
                {/*            ))}*/}
                {/*        </ul>*/}
                {/*        <button onClick={handleClear} className="verify-clear">Clear</button>*/}
                {/*    </>*/}
                {/*)}*/}
            </div>
            <div className="profile-content">
                {previewUrl ? (
                    docType === 'application/pdf' ? (
                        <iframe src={previewUrl} title="Preview" className="preview-frame" />
                    ) : (
                        <WordPreview fileUrl={previewUrl} full={true} />
                    )
                ) : (
                    <UploadArea onUpload={handleUpload} />
                )}
            </div>
        </div>
    );
};

export default Verify;