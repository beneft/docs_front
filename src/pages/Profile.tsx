import React, { useState } from 'react';
import '../styles/Profile.css';
import UploadArea from '../components/UploadArea';
import PaperBasketSection from '../components/PaperBasketSection';
import type { DocumentItem } from '../components/PaperBasketSection';
import SignModal from "../components/SignModal";

const Profile: React.FC = () => {
    const [selected, setSelected] = useState<string | null>(null);
    const [basketOpen, setBasketOpen] = useState(false);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [documentStep, setDocumentStep] = useState<1 | 2 | null>(null);
    const [documentName, setDocumentName] = useState<string>('');
    const [openedDocument, setOpenedDocument] = useState<DocumentItem | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);

    const dummyDocs: DocumentItem[] = [
        { id: '1', name: 'Contract Draft', previewUrl: 'https://example.com/doc1' },
        { id: '2', name: 'Invoice 2024', previewUrl: 'https://example.com/doc2' },
        { id: '3', name: 'Proposal XYZ', previewUrl: 'https://example.com/doc3' },
    ];

    const handleDocumentUpload = (url: string) => {
        setDocumentUrl(url);
        setDocumentStep(1);
    };

    const clearDocument = () => {
        setDocumentUrl(null);
        setDocumentStep(null);
        setDocumentName('');
    };

    const proceedToDrafts = () => {
        clearDocument();
        setSelected('Drafts');
        setBasketOpen(true);
    };

    const handleSectionSelect = (section: string) => {
        setSelected(section);
        // Clear all contextual right panel state
        setDocumentStep(null);
        setDocumentUrl('');
        setOpenedDocument(null);
        setDocumentName('');
    };

    const renderContent = () => {
        if (documentStep === 1 && documentUrl) {
            return (
                <iframe src={documentUrl} className="preview-frame" title="Document Preview" />
            );
        } else if (documentStep === 2) {
            return (
                <div className="document-settings">
                    <h2>Document Settings</h2>
                    <label><input type="checkbox" /> Confidential</label><br />
                    <label><input type="checkbox" /> Requires Signature</label><br />
                    <label><input type="checkbox" /> Send Notification</label><br />
                    {/* Add more options as needed */}
                </div>
            );
        } else if (selected === 'create') {
            return <UploadArea onUpload={handleDocumentUpload} />;
        } else if (openedDocument) {
            return (
                <div className="preview-wrapper">
                    <iframe src={openedDocument.previewUrl} className="preview-frame" title="Preview" />
                    <button className="floating-sign-btn" onClick={() => setShowSignModal(true)}>Sign</button>
                    {showSignModal && <SignModal onClose={() => setShowSignModal(false)} />}
                </div>
            );
        } else if (['Sent', 'Received', 'Closed', 'Drafts', 'Archive', 'Deleted'].includes(selected || '')) {
            return (
                <PaperBasketSection
                    title={selected!}
                    items={dummyDocs}
                    onItemClick={(doc) => setOpenedDocument(doc)}
                />
            );
        } else {
            return <div className="placeholder">Select an option from the left panel</div>;
        }
    };

    const renderRightPanel = () => {
        if (documentStep === 1 && documentUrl) {
            return (
                <div className="right-controls">
                    <button onClick={clearDocument}>Clear</button>
                    <input
                        type="text"
                        placeholder="Name your document"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                    />
                    <button onClick={() => setDocumentStep(2)}>Proceed</button>
                </div>
            );
        } else if (documentStep === 2) {
            return (
                <div className="right-controls">
                    <button onClick={() => setDocumentStep(1)}>Back to step 1</button>
                    <p><br></br>Almost done. Click below to finish and save to Drafts.</p>
                    <button onClick={proceedToDrafts}>Finish</button>
                </div>
            );
        } else if (openedDocument) {
            return (
                <div className="right-controls">
                    <button className="back-button" onClick={() => setOpenedDocument(null)}>← Back to list</button>
                    <h2 className='signHeader'>{openedDocument.name}</h2>
                    <h3>Signees</h3>
                    <ul className="signer-list">
                        {/* Placeholder signees list */}
                        {[
                            { name: 'Alice Johnson', status: 'Signed', you: false },
                            { name: 'Bob Smith', status: 'Pending', you: false },
                            { name: 'You', status: 'Pending', you: true }
                        ].map((signee, index) => (
                            <li key={index} className="signer-item">
                                <strong className="signer-name">{signee.name}</strong>
                                <span className={`signer-status ${signee.status.toLowerCase()}`}>
                            {signee.status === 'Signed' ? '✔️' : '⏳'} {signee.status}
                                </span>
                                {!signee.you && (
                                    <div className="signer-actions">
                                <button>Edit Deputy</button>
                                <button>Contact</button>
                                </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="profile-page">
            {/* LEFT PANEL */}
            <div className="profile-nav">
                <div className="nav-logo">DocFlow</div>
                <a className="back-button" href="/">← Back</a>

                {documentStep ? (
                    <div className="step-header">
                        <p>📄 Document Creation</p>
                        <strong><br></br>Step {documentStep}: {documentStep === 1 ? 'Verify Document' : 'Settings'}</strong>
                    </div>
                ) : (
                    <>
                        <button onClick={() => handleSectionSelect('info')}
                                className={selected === 'info' ? 'active' : ''}>User Info</button>
                        <button onClick={() => handleSectionSelect('create')}
                                className={selected === 'create' ? 'active' : ''}>Create Document</button>

                        <div className="dropdown">
                            <button
                                className={`dropdown-toggle ${basketOpen ? 'open' : ''}`}
                                onClick={() => setBasketOpen(!basketOpen)}
                            >
                                Paper Basket
                                <span className={`dropdown-icon ${basketOpen ? 'open' : ''}`}>▼</span>
                            </button>

                            <div className={`dropdown-content ${basketOpen ? 'open' : ''}`}>
                                {['Sent', 'Received', 'Closed', 'Drafts', 'Archive', 'Deleted'].map((item) => (
                                    <button
                                        key={item}
                                        className={selected === item ? 'active' : ''}
                                        onClick={() => handleSectionSelect(item)}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => handleSectionSelect('templates')}
                                className={selected === 'templates' ? 'active' : ''}>Templates</button>
                        <button onClick={() => handleSectionSelect('help')}
                                className={selected === 'help' ? 'active' : ''}>Help</button>
                    </>
                )}
            </div>

            {/* CENTER PANEL */}
            <div className="profile-content">
                {renderContent()}
            </div>

            {/* RIGHT PANEL */}
            <div className="profile-extra">
                {renderRightPanel()}
            </div>
        </div>
    );
};

export default Profile;