import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/Profile.css';
import SignModal from "../components/SignModal";
import type { DocumentItem } from '../components/PaperBasketSection';
import SignerList from "../components/SignerList";
import WordPreview from "../components/WordPreview";
import { SignerDTO } from "./Profile";

const SignPage: React.FC = () => {
    const { id, mail } = useParams<{ id: string; mail: string }>();
    const [openedDocument, setOpenedDocument] = useState<DocumentItem | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [signersFromServer, setSignersFromServer] = useState<SignerDTO[]>([]);
    const [currentSigner, setCurrentSigner] = useState<SignerDTO | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchMetadataAndUrl();
    }, [id]);

    const fetchMetadataAndUrl = async () => {
        try {
            const metaRes = await fetch(`http://localhost:8082/documents/${id}/metadata`);
            if (!metaRes.ok) throw new Error('Metadata fetch failed');

            const meta = await metaRes.json();
            const document: DocumentItem = {
                id: meta.id,
                name: meta.name,
                contentType: meta.contentType,
                previewUrl: `http://localhost:8082/documents/${meta.id}`
            };

            setOpenedDocument(document);
        } catch (err) {
            console.error('Failed to load document:', err);
            alert('Could not load document.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!openedDocument) {
            setSignersFromServer([]);
            setCurrentSigner(null);
            return;
        }
        fetch(`http://localhost:8083/approval/${openedDocument.id}/signers`)
            .then(res => res.json())
            .then(data => {
                const signers = Array.isArray(data) ? data : [];
                setSignersFromServer(signers);
                try {
                    const decodedEmail = atob(decodeURIComponent(mail!));
                    const found = signers.find(s => s.email.toLowerCase() === decodedEmail.toLowerCase());
                    setCurrentSigner(found || null);
                } catch (err) {
                    console.error("Failed to decode or match signer", err);
                    setCurrentSigner(null);
                }
            })
            .catch(err => {
                console.error("Failed to fetch signers", err);
                setSignersFromServer([]);
                setCurrentSigner(null);
            });
    }, [openedDocument, mail]);


    const renderContent = () => {
        if (loading) return <div className="loading">Loading document...</div>;
        if (!openedDocument) return <div className="error">Document not found.</div>;

        const isDocFile = openedDocument.contentType === 'application/msword' ||
            openedDocument.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        return (
            <div className="preview-wrapper">
                {isDocFile ? (
                    <WordPreview fileUrl={openedDocument.previewUrl} full={true} />
                ) : (
                    <iframe src={openedDocument.previewUrl} title={openedDocument.name} className="preview-frame" />
                )}
                <button className="floating-sign-btn" onClick={() => setShowSignModal(true)}>Sign</button>
                {showSignModal && (
                    <SignModal
                        onClose={() => setShowSignModal(false)}
                        openedDocument={openedDocument}
                        guest = {currentSigner!.email}
                    />
                )}
            </div>
        );
    };

    const renderRightPanel = () => {
        if (!openedDocument) return null;
        return (
            <div className="right-controls">
                <h2 className='signHeader'>{openedDocument.name}</h2>
                <h3>Signees</h3>
                <ul className="signer-list">
                    {(signersFromServer ?? []).map((signee, index) => {
                        const isYou = currentSigner?.email === signee.email;
                        const waitingTurn = signee.status === "PENDING" && !signee.canSignNow;
                        const statusIcon = signee.status === "SIGNED" ? "✔️"
                            : signee.status === "DECLINED" ? "❌"
                                : waitingTurn ? "🕓"
                                    : "⏳";

                        const statusText = signee.status === "SIGNED" ? "Signed"
                            : signee.status === "DECLINED" ? "Declined"
                                : waitingTurn ? "Waiting"
                                    : "Pending";
                        return (
                            <li key={index} className={`signer-item ${waitingTurn ? "signer-disabled" : ""}`}>
                                <div className="signer-main">
                                    <div className="signer-left">
                                        <strong className="signer-name">
                                            {isYou ? "You" : signee.fullName}
                                        </strong>
                                        <div className="signer-info">
                                            <span className="signer-email">{signee.email}</span> |{" "}
                                            <span className="signer-position">{signee.position}</span>
                                        </div>
                                        {!isYou && (
                                            <div className="signer-actions">
                                                <button>Contact</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`signer-status ${signee.status.toLowerCase()}`}>
                                        {statusIcon} {statusText}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    return (
        <div className="profile-page">
            <div className="profile-nav">
                <div className="nav-logo">DocFlow</div>
                <a className="back-button" href="/">← Back</a>
            </div>
            <div className="profile-content">
                {renderContent()}
            </div>
            <div className="profile-extra">
                {renderRightPanel()}
            </div>
        </div>
    );
};

export default SignPage;