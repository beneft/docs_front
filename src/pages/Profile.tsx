import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import UploadArea from '../components/UploadArea';
import PaperBasketSection from '../components/PaperBasketSection';
import type { DocumentItem } from '../components/PaperBasketSection';
import SignModal from "../components/SignModal";
import SignerList from "../components/SignerList";

const Profile: React.FC = () => {
    const [selected, setSelected] = useState<string | null>(null);
    const [basketOpen, setBasketOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [documentStep, setDocumentStep] = useState<1 | 2 | null>(null);
    const [documentName, setDocumentName] = useState<string>('');
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [openedDocument, setOpenedDocument] = useState<DocumentItem | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8082/documents/metadata')
            .then(res => res.json())
            .then((data: { id: string; name: string; contentType: string }[]) => {
                const fullDocs = data.map(d => ({
                    id: d.id,
                    name: d.name,
                    contentType: d.contentType,
                    previewUrl: `http://localhost:8082/documents/${d.id}`
                }));
                setDocuments(fullDocs);
            })
            .catch(console.error);
    }, []);

    const dummyDocs: DocumentItem[] = [
        { id: '1', name: 'Contracthhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh Draft', contentType:"application/pdf", previewUrl: 'https://example.com/doc1' },
        { id: '2', name: 'Invoice 2024', contentType:"application/pdf",previewUrl: 'https://example.com/doc2' },
        { id: '3', name: 'Proposal XYZ', contentType:"application/pdf",previewUrl: 'https://example.com/doc3' },
    ];

    const handleDocumentUpload = (file: File, url: string) => {
        setUploadedFile(file);
        setDocumentUrl(url);
        setDocumentName(file.name);
        setDocumentStep(1);
    };

    const clearDocument = () => {
        setLoading(false);
        setDocumentUrl(null);
        setDocumentStep(null);
        setDocumentName('');
    };

    const proceedToDrafts = async () => {
        setLoading(true);
        if (!uploadedFile || !documentName) {
            alert('Please upload a file and name it.');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('metadata', JSON.stringify({
            name: documentName,
            uploaderId: '666'
        }));

        try {
            const response = await fetch('http://localhost:8082/documents', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            alert('Document uploaded successfully!');
            clearDocument();
            setSelected('Drafts');
            setBasketOpen(true);
        } catch (err) {
            console.error(err);
            alert('Error uploading document');
        } finally {
            setLoading(false);
        }
    };

    const handleSectionSelect = (section: string) => {
        setSelected(section);
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
                    <SignerList></SignerList>
                </div>
            );
        } else if (selected === 'create') {
            return <UploadArea onUpload={handleDocumentUpload} />;
        } else if (openedDocument) {
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
                    {showSignModal && openedDocument && (
                        <SignModal
                            onClose={() => setShowSignModal(false)}
                            openedDocument={openedDocument}
                        />
                    )}
                </div>
            );
        } else if (['Sent', 'Received', 'Closed', 'Drafts', 'Archive', 'Deleted'].includes(selected || '')) {
            return (
                <PaperBasketSection
                    title={selected!}
                    items={dummyDocs}
                    //items={documents}
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
                    <button onClick={proceedToDrafts}>Finish{loading && <span className="spinner" />}</button>
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
                            { name: 'Alice Johnsonввввввввввввввввввввввввввввввввввввв', status: 'Signed', you: false },
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