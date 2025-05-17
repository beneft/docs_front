import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/Profile.css';
import SignModal from "../components/SignModal";
import type { DocumentItem } from '../components/PaperBasketSection';
import SignerList from "../components/SignerList";

const SignPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [openedDocument, setOpenedDocument] = useState<DocumentItem | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

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

        fetchMetadataAndUrl();
    }, [id]);

    const renderContent = () => {
        if (loading) return <div className="loading">Loading document...</div>;
        if (!openedDocument) return <div className="error">Document not found.</div>;

        const isDocFile = openedDocument.contentType === 'application/msword' ||
            openedDocument.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        return (
            <div className="preview-wrapper">
                {isDocFile ? (
                    <div className="doc-placeholder">No preview for DOC/DOCX</div>
                ) : (
                    <iframe src={openedDocument.previewUrl} title={openedDocument.name} className="preview-frame" />
                )}
                <button className="floating-sign-btn" onClick={() => setShowSignModal(true)}>Sign</button>
                {showSignModal && (
                    <SignModal
                        onClose={() => setShowSignModal(false)}
                        openedDocument={openedDocument}
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
                    {[
                        { name: 'Alice Johnson', status: 'Signed', you: false },
                        { name: 'Bob Smith', status: 'Pending', you: false },
                        { name: 'You', status: 'Pending', you: true }
                    ].map((signee, index) => (
                        <li key={index} className="signer-item">
                            <div className="signer-main">
                                <div className="signer-left">
                                    <strong className="signer-name">{signee.name}</strong>
                                    {!signee.you && (
                                        <div className="signer-actions">
                                            <button>Edit Deputy</button>
                                            <button>Contact</button>
                                        </div>
                                    )}
                                </div>
                                <div className={`signer-status ${signee.status.toLowerCase()}`}>
                                    {signee.status === 'Signed' ? '✔️' : '⏳'} {signee.status}
                                </div>
                            </div>
                        </li>
                    ))}
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