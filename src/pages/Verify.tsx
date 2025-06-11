import React, { useState } from 'react';
import UploadArea from '../components/UploadArea';
import '../styles/Profile.css';
import '../styles/Verify.css';
import WordPreview from "../components/WordPreview";
import { SignerDTO } from "./Profile";
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('verify');
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
            alert(t('doc-id-not-found'));
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
                alert(t('no-v2-found'));
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
                alert(t('both-failed'));
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
                <a className="back-button" href="/">{t('back-btn')}</a>
                {verifyResultV2 ? (
                    <>
                        <h2>{t('verify-result-v2')}</h2>
                        {verifyResultV2.length === 0 ? (
                            <p className="verify-no-signatures">{t('no-signs-found')}</p>
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
                                            <strong>{sig.authorName} | {subject?.commonName} | {t('cms-iin')}: {subject?.iin}</strong><br />
                                            {t('cms-org')}: {subject?.organization ?? "N/A"}<br />
                                            {t('cms-signed-date')}: {tspTime ? new Date(tspTime).toLocaleString() : t('cms-unknown')}<br />
                                            {t('cert-valid-from')}: {cert?.notBefore ? new Date(cert.notBefore).toLocaleDateString() : "?"}<br />
                                            {t('cert-valid-to')}: {cert?.notAfter ? new Date(cert.notAfter).toLocaleDateString() : "?"}<br />
                                            {t('cert-status')}: {valid ? t('cert-valid') : t('cert-invalid')}
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
                                        return <p className="verify-success">✅ {t('all-signed')}</p>;
                                    } else {
                                        return (
                                            <>
                                                {missing.length > 0 && (
                                                    <div className="verify-warning">
                                                        ⚠️ {t('missing-signs')}:
                                                        <ul className="verify-signer-list">
                                                            {missing.map(m => (
                                                                <li className="verify-signer-item verify-invalid" key={m.userId}>
                                                                    {m.fullName} ({m.email}) - {t('missing-status')}: {m.status}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {extra.length > 0 && (
                                                    <div className="verify-warning">
                                                        ⚠️ {t('unknown-signs')}:
                                                        <ul className="verify-signer-list">
                                                            {extra.map((id, i) => (
                                                                <li className="verify-signer-item verify-invalid" key={i}>
                                                                    {t('unknown-1')} {id} {t('unknown-2')}
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
                        <button onClick={handleClear} className="verify-clear">{t('clear-btn')}</button>
                    </>
                ) : verifyResult && verifyResult.signatures ? (
                        <>
                            <h2>{t('verify-result-v1')}</h2>
                            <ul className="verify-signer-list">
                                {verifyResult.signatures.map((sig: SignatureDTO, index: number) => (
                                    <li key={index} className={`verify-signer-item ${sig.cmsValid ? "verified" : "invalid"}`}>
                                        <strong>{sig.authorName}</strong><br />
                                        {t('cms-signed-date')}: {new Date(sig.signingDate).toLocaleString()}<br />
                                        {t('cms-org')}: {sig.authorOrganization}<br />
                                        {t('cert-status')}: {sig.cmsValid ? t('cert-valid') : t('cert-invalid')}
                                    </li>
                                ))}
                            </ul>
                            <p><strong>{t('verify-old-valid')}:</strong> {verifyResult.cmsValid ? "✅ Yes" : "❌ No"}</p>
                            <p><strong>{t('verify-old-uploader')}:</strong> {verifyResult.uploaderId}</p>
                            <p><strong>{t('verify-old-date')}:</strong> {new Date(verifyResult.createdDate).toLocaleString()}</p>
                            <button onClick={handleClear} className="verify-clear">{t('clear-btn')}</button>
                        </>
                    ) : (<>
                    <h2>{t('verify-title')}</h2>
                    <p className="instructions">
                        {t('verify-instructions')}
                    </p>
                    {file && (
                        <div className="verify-button">
                            <p>{t('have-uploaded')} "{file.name}".</p>
                            <button className="verify-verify" onClick={handleVerify}>{t('verify-btn')}{loading && <span className="spinner" />}</button>
                            <button className="verify-clear" onClick={handleClear}>{t('clear-btn')}</button>
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