import React, { useState } from 'react';
import UploadArea from '../components/UploadArea';
import '../styles/Profile.css';
import '../styles/Verify.css';
import WordPreview from "../components/WordPreview";
import { SignerDTO } from "./Profile";

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

interface V2SignatureVerification {
    authorId: string;
    authorName: string;
    verificationResponse: V2VerificationResponse | null;
}

interface V2VerificationResponse {
    valid: boolean;
    signers: {
        certificates: {
            valid: boolean;
            notBefore: string;
            notAfter: string;
            subject: {
                commonName: string;
                surName: string;
                iin: string;
                country: string;
                dn: string;
                organization?: string;
            };
        }[];
        tsp?: {
            genTime: string;
        };
    }[];
}

const Verify: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [docType, setDocType] = useState<string | null>(null);
    const [verifyResult, setVerifyResult] = useState<CmsDetailsDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [verifyResultV2, setVerifyResultV2] = useState<V2SignatureVerification[] | null>(null);
    const [verificationUsedFallback, setVerificationUsedFallback] = useState(false);
    const [signersFromServer, setSignersFromServer] = useState<SignerDTO[]>([]);

    const fetchSigners = async (documentId: string) => {
        try {
            const res = await fetch(`http://localhost:8083/approval/${documentId}/signers`);
            const data = await res.json();
            setSignersFromServer(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch signers", err);
            setSignersFromServer([]);
        }
    };

    const handleUpload = (file: File, url: string, docType: string) => {
        setFile(file);
        setPreviewUrl(url);
        setDocType(docType);
    };


    const handleVerify = async () => {
        setLoading(true);
        setVerificationUsedFallback(false);
        setVerifyResult(null);
        setVerifyResultV2(null);

        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const match = file.name.match(/-id([a-fA-F0-9]+)\./);
        const documentId = match?.[1];

        if (!documentId) {
            alert("Document ID not found in file name.");
            setLoading(false);
            return;
        }

        formData.append('id', documentId);

        try {
            const res = await fetch('http://localhost:8083/signatures/verify/v2', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('V2 failed');

            const result = await res.json();
            if (!Array.isArray(result) || result.length === 0) {
                alert('No signatures found.');
                setVerifyResultV2([]);
                return;
            }

            setVerifyResultV2(result);

            await fetchSigners(documentId);

        } catch (error) {
            try {
                const fallback = await fetch('http://localhost:8083/signatures/verify', {
                    method: 'POST',
                    body: formData
                });

                if (!fallback.ok) throw new Error('Fallback also failed');

                const fallbackResult = await fallback.json();
                setVerificationUsedFallback(true);
                setVerifyResult(fallbackResult);
            } catch (fallbackError) {
                alert('Both V2 and fallback verification failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreviewUrl(null);
        setVerifyResult(null);
        setVerificationUsedFallback(false);
        setVerifyResultV2(null);
        setDocType(null);
        setSignersFromServer([]);
    };

    return (
        <div className="profile-page">
            <div className="profile-nav profile-nav-verify">
                <div className="nav-logo">DocFlow</div>
                <a className="back-button" href="/">← Back</a>
                {verifyResultV2 ? (
                    <>
                        <h2>Verification Results (V2)</h2>
                        {verifyResultV2.length === 0 ? (
                            <p className="verify-no-signatures">No signatures found.</p>
                        ) : (
                            <ul className="verify-signer-list">
                                {verifyResultV2.map((sig, index) => {
                                    const response = sig.verificationResponse;
                                    const signerEntry = response?.signers?.[0];
                                    const cert = signerEntry?.certificates?.[0];
                                    const tspTime = signerEntry?.tsp?.genTime;

                                    const valid = cert?.valid ?? false;
                                    const subject = cert?.subject;

                                    return (
                                        <li key={index} className={`verify-signer-item ${valid ? "verified" : "verify-invalid"}`}>
                                            <strong>{sig.authorName} | {subject?.commonName} | IIN: {subject?.iin}</strong><br />
                                            Organization: {subject?.organization ?? "N/A"}<br />
                                            Signed: {tspTime ? new Date(tspTime).toLocaleString() : "Unknown"}<br />
                                            Valid From: {cert?.notBefore ? new Date(cert.notBefore).toLocaleDateString() : "?"}<br />
                                            Valid To: {cert?.notAfter ? new Date(cert.notAfter).toLocaleDateString() : "?"}<br />
                                            Certificate: {valid ? "Valid" : "Invalid"}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {signersFromServer.length > 0 && (
                            <div className="verify-comparison-section">
                                {(() => {
                                    const verifiedIds = verifyResultV2.map(sig => sig.authorId);
                                    const missing = signersFromServer.filter(s => !verifiedIds.includes(s.userId));
                                    const extra = verifiedIds.filter(v => !signersFromServer.some(s => s.userId === v));

                                    if (missing.length === 0 && extra.length === 0) {
                                        return <p className="verify-success">✅ All expected signers have valid signatures. Document is verified.</p>;
                                    } else {
                                        return (
                                            <>
                                                {missing.length > 0 && (
                                                    <div className="verify-warning">
                                                        ⚠️ Missing Signatures from:
                                                        <ul className="verify-signer-list">
                                                            {missing.map(m => (
                                                                <li className="verify-signer-item verify-invalid" key={m.userId}>
                                                                    {m.fullName} ({m.email}) - Status: {m.status}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {extra.length > 0 && (
                                                    <div className="verify-warning">
                                                        ⚠️ Unknown signers present:
                                                        <ul className="verify-signer-list">
                                                            {extra.map((id, i) => (
                                                                <li className="verify-signer-item verify-invalid" key={i}>
                                                                    Signer with ID {id} was not expected
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }
                                })()}
                            </div>
                        )}
                        <button onClick={handleClear} className="verify-clear">Clear</button>
                    </>
                ) : verifyResult && verifyResult.signatures ? (
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