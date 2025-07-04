import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';
import UploadArea from '../components/UploadArea';
import PaperBasketSection from '../components/PaperBasketSection';
import type { DocumentItem } from '../components/PaperBasketSection';
import SignModal from "../components/SignModal";
import SignerList from "../components/SignerList";
import type { Signer } from '../components/SignerList';
import WordPreview from "../components/WordPreview";
import { useAuth } from '../context/AuthContext';
import UserProfilePanel from '../components/UserInfo';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TagManager from "../components/TagManager";
import TagFilter from "../components/TagFilter";

export interface SignerDTO {
    userId: string;
    fullName: string;
    email: string;
    position: string;
    deputy?: DeputyDTO;
    status: 'PENDING' | 'SIGNED' | 'DECLINED';
    canSignNow: boolean;
}

type DeputyDTO = {
    id: string;
    name: string;
    email: string;
};

const Profile: React.FC = () => {
    const { t } = useTranslation('profile');
    const [selected, setSelected] = useState<string | null>(null);
    const [basketOpen, setBasketOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [documentType, setDocumentType] = useState<string | null>(null);
    const [documentStep, setDocumentStep] = useState<1 | 2 | null>(null);
    const [uploadView, setUploadView] = useState(false);
    const [documentName, setDocumentName] = useState<string>('');
    const [signers, setSigners] = useState<Signer[]>([]);
    const [sequentialSigning, setSequentialSigning] = useState(false);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [readyDocuments, setReadyDocuments] = useState<DocumentItem[]>([]);
    const [receivedDocuments, setReceivedDocuments] = useState<DocumentItem[]>([]);
    const [drafts, setDrafts] = useState<DocumentItem[]>([]);
    const [openedDocument, setOpenedDocument] = useState<DocumentItem | null>(null);
    const [editedDocument, setEditedDocument] = useState<DocumentItem | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchedSignerList, setFetchedSignerList] = useState(false);
    const [templates, setTemplates] = useState<DocumentItem[]>([]);
    const [openedTemplate, setOpenedTemplate] = useState<DocumentItem | null>(null);
    const [templateFields, setTemplateFields] = useState<{ name: string; type: string; }[]>([]);
    const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
    const [expirationYears, setExpirationYears] = useState(0);
    const [expirationMonths, setExpirationMonths] = useState(0);
    const [expirationDays, setExpirationDays] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const { user , login, getAccessToken} = useAuth();
    const navigate = useNavigate();
    const [signersFromServer, setSignersFromServer] = useState<SignerDTO[]>([]);
    // TODO: УБРАТЬ ВЫВОД BASE64
    // useEffect(() => {
    //     const fetchAndEncodeDocument = async () => {
    //         if (openedDocument?.previewUrl) {
    //             try {
    //                 const response = await fetch(openedDocument.previewUrl);
    //                 const blob = await response.blob();
    //                 const reader = new FileReader();
    //
    //                 reader.onloadend = () => {
    //                     const base64data = reader.result;
    //                     console.log("Base64-encoded document:", base64data);
    //                 };
    //
    //                 reader.readAsDataURL(blob);
    //             } catch (error) {
    //                 console.error("Failed to fetch and encode document:", error);
    //             }
    //         }
    //     };
    //     fetchAndEncodeDocument();
    // }, [openedDocument]);
    useEffect(()=>{
        if (!user){
            navigate("/login");
        }
    }, []);

    useEffect(() => {
        fetch('http://localhost:8084/templates/metadata')
            .then(res => res.json())
            .then((data: { id: string; name: string; contentType: string }[]) => {
                const fullDocs = data.map(d => ({
                    id: d.id,
                    name: d.name,
                    contentType: d.contentType,
                    previewUrl: `http://localhost:8084/templates/${d.id}`,
                    expirationDate: null,
                    status: ""
                }));
                setTemplates(fullDocs);
            })
            .catch(console.error);
    }, []);


    useEffect(() => {
        fetchDocumentMetadata();
    }, []);

    const fetchDocumentMetadata = async (tags: string[] = []) => {
        const token = getAccessToken();
        if (!token || !user?.id) {
            console.warn("No access token or user — cannot fetch documents");
            return;
        }

        const tagParams = tags.map(t => `tags=${encodeURIComponent(t.trim().replace(/^"+|"+$/g, ''))}`).join('&');

        try {
            const uploadedRes = await fetch(
                `http://localhost:8082/documents/metadata?uploaderId=${user.id}&${tagParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!uploadedRes.ok) throw new Error("Failed to fetch uploaded documents");
            const uploadedData: { id: string; name: string; contentType: string; expirationDate: Date; status: string; type: string }[] = await uploadedRes.json();

            const uploadedDocs = uploadedData.map((d) => ({
                id: d.id,
                name: d.name,
                contentType: d.contentType,
                previewUrl: `http://localhost:8082/documents/${d.id}`,
                expirationDate: d.expirationDate,
                status: d.status,
                type: d.type,
            }));

            const ready = uploadedDocs.filter(doc => doc.type === "READY");
            const drafts = uploadedDocs.filter(doc => doc.type === "DRAFT");
            const others = uploadedDocs.filter(doc => doc.type !== "READY" && doc.type !== "DRAFT");

            setDrafts(drafts);
            setReadyDocuments(ready);
            setDocuments(others);

            const receivedIdsRes = await fetch(
                `http://localhost:8082/users/${user.id}/documents`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!receivedIdsRes.ok) throw new Error("Failed to fetch received document IDs");

            const receivedDocIds: string[] = await receivedIdsRes.json();

            const receivedPromises = receivedDocIds.map(id =>
                fetch(`http://localhost:8082/documents/metadata?documentId=${id}&${tagParams}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.ok ? res.json() : null)
            );

            const receivedResults = await Promise.all(receivedPromises);
            const flattenedResults = receivedResults
                .filter(Boolean)
                .flat();
            const receivedDocs = flattenedResults.map((d: any) => ({
                id: d.id,
                name: d.name,
                contentType: d.contentType,
                previewUrl: `http://localhost:8082/documents/${d.id}`,
                expirationDate: d.expirationDate,
                status: d.status,
                type: d.type
            }));


            setReceivedDocuments(receivedDocs);
        } catch (err) {
            console.error("Error fetching document metadata:", err);
        }
    };


    useEffect(() => {
        fetchSigners();
    }, [openedDocument]);

    const fetchSigners = async () => {
        if (openedDocument) {
            fetch(`http://localhost:8083/signatures/approval/${openedDocument.id}/signers`)
                .then(res => res.json())
                .then(data => {
                    setSignersFromServer(Array.isArray(data) ? data : []);
                    console.log(data);
                })
                .catch(err => {
                    console.error("Failed to fetch signers", err);
                    setSignersFromServer([]);
                });
        } else {
            setSignersFromServer([]);
        }
    }

    const handleSigning = () => {
        fetchSigners();
        setShowSignModal(false);
    }

    const handleDocumentUpload = (file: File, url: string, docType: string) => {
        setUploadedFile(file);
        setDocumentUrl(url);
        setDocumentName(file.name);
        setDocumentType(docType);
        //setDocumentStep(1);
        setUploadView(true);
    };

    const clearDocument = () => {
        setLoading(false);
        setDocumentUrl(null);
        setDocumentStep(null);
        setDocumentType(null);
        setDocumentName('');
        setOpenedDocument(null);
        setUploadView(false);
        setOpenedTemplate(null);
        setSigners([]);
        setSequentialSigning(false);
        setSignersFromServer([]);
        setFetchedSignerList(false);
        setExpirationDays(0);
        setExpirationYears(0);
        setExpirationMonths(0);
    };

    const proceedToDrafts = async () => {
        setLoading(true);
        const token = getAccessToken();
        if (!uploadedFile || !documentName) {
            alert(t('please-upload'));
            setLoading(false);
            return;
        }

        const originalName = uploadedFile.name;
        const extensionMatch = originalName.match(/\.(docx|pdf)$/i);
        if (!extensionMatch) {
            alert(t('only-doc-pdf'));
            setLoading(false);
            return;
        }
        const originalExtension = extensionMatch[0].toLowerCase();
        const baseName = documentName.replace(/\.(docx|pdf)$/i, '');

        let id;
        try {
            const idResponse = await fetch('http://localhost:8082/documents/next-id');
            if (!idResponse.ok) {
                throw new Error('Failed to fetch document ID');
            }
            id = await idResponse.text();
        } catch (err) {
            console.error(err);
            alert(t('fail-gen-id'));
            setLoading(false);
            return;
        }

        const finalName = `${baseName}-id${id}${originalExtension}`;

        const renamedFile = new File([uploadedFile], finalName, {
            type: uploadedFile.type,
            lastModified: uploadedFile.lastModified
        });


        const formData = new FormData();
        formData.append('file', renamedFile);

        if (user != null) {
            formData.append('metadata', JSON.stringify({
                name: finalName,
                type: "DRAFT",
                id: id
                //uploaderId: user.id
            }));
        } else {
            setLoading(false);
            return null;
        }

        try {
            const response = await fetch('http://localhost:8082/documents', {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            // const uploadResult = await response.json();
            // const documentId = uploadResult.documentId;
            // const signingPayload = {
            //     documentId,
            //     initiator: user?.id,
            //     approvalType: sequentialSigning ? "SEQUENTIAL" : "PARALLEL",
            //     signers: signers,
            //     currentSignerIndex: 0
            // };
            // console.log(signingPayload);
            // try {
            //     const startResponse = await fetch("http://localhost:8083/approval/start", {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json",
            //             "Authorization": `Bearer ${token}`},
            //         body: JSON.stringify(signingPayload)
            //     });
            //
            //     if (!startResponse.ok) {
            //         throw new Error("Failed to start signing process");
            //     }
            //
            //     alert("Signing process started successfully!");
            // } catch (err) {
            //     console.error(err);
            //     alert("Failed to initiate signing process");
            // }

            alert(t('upload-success'));
            clearDocument();
            fetchDocumentMetadata();
            setSelected('Drafts');
            setBasketOpen(true);
        } catch (err) {
            console.error(err);
            alert(t('upload-error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchListSigners = async (documentId: string) => {
        try {
            const response = await fetch("http://localhost:8082/documents/"+documentId+"/metadata/signers");
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
                setSigners(data);
            }
        } catch (err) {
            console.log("Empty signer list initiated.");
            //console.error("Failed to fetch signers", err);
        } finally {
            // overwrite fix?
        }
    };

    const saveEditedSigners = async () => {
        if (!editedDocument) return;
        const documentId = editedDocument.id;
        const token = getAccessToken();

        try {
            const response = await fetch("http://localhost:8082/documents/"+documentId+"/metadata/signers", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(signers)
            });

            if (!response.ok) throw new Error("Failed to edit document data.");

            alert(t('drafts-saved'));
            clearDocument();
            fetchDocumentMetadata();
            setSelected('Drafts');
            setBasketOpen(true);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            console.error(err);
            alert(t('drafts-fail'));
        }
    }

    const startApprovalProcess = async () => {
        if (!editedDocument) return;
        const documentId = editedDocument.id;
        const token = getAccessToken();
        const signingPayload = {
            documentId,
            initiator: user?.id,
            approvalType: sequentialSigning ? "SEQUENTIAL" : "PARALLEL",
            signers: signers,
            currentSignerIndex: 0
        };
        let expirationDatePayload: string | null = null;
        if (expirationYears !== 0 || expirationMonths !== 0 || expirationDays !== 0) {
            const now = new Date();
            const expirationDate = new Date(
                now.getFullYear() + expirationYears,
                now.getMonth() + expirationMonths,
                now.getDate() + expirationDays
            );
            const isoString = expirationDate.toISOString();
            expirationDatePayload = isoString.replace(/Z$/, '');
        }

        try {

            const responseTag = await fetch("http://localhost:8082/documents/" + documentId + "/metadata/tags", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(selectedTags.map(t => t.replace(/^"+|"+$/g, '')))
            });

            if (!responseTag.ok) {
                throw new Error("Failed to add tags.");
            }

            if (expirationDatePayload !== null) {
                const responseExp = await fetch(`http://localhost:8082/documents/${documentId}/metadata/expiration`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(expirationDatePayload)
                });

                if (!responseExp.ok) {
                    throw new Error("Failed to update expiration date.");
                }
            }

            const response = await fetch("http://localhost:8083/signatures/approval/start", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(signingPayload)
            });

            if (!response.ok) throw new Error("Failed to start signing process");

            alert(t('process-success'));
            clearDocument();
            fetchDocumentMetadata();
            setSelected('Sent');
            setBasketOpen(true);
        } catch (err) {
            console.error(err);
            alert(t('process-failed'));
        }
    };

    const handleEditSequence = (doc: DocumentItem) => {
        setDocumentStep(1);
        setDocumentUrl(doc.previewUrl);
        setDocumentType(doc.contentType);
        setDocumentName(doc.name);
        setEditedDocument(doc);
        setSelected(null);
    }

    const handleSectionSelect = (section: string) => {
        setSelected(section);
        setDocumentStep(null);
        setDocumentUrl('');
        setOpenedDocument(null);
        setDocumentName('');
    };

    const handleTemplateClick = async (template: DocumentItem) => {
        setOpenedTemplate(template);
        setTemplateFields([]);
        setFieldValues({});
        try {
            const response = await fetch(`http://localhost:8084/templates/${template.id}/fields`);
            const fields = await response.json(); // expected format: [{ name: 'clientName', type: 'text' }, ...]
            setTemplateFields(fields);
        } catch (e) {
            console.error("Failed to fetch fields", e);
        }
    };

    const renderContent = () => {
        if (uploadView && documentUrl){
            if (documentType === 'application/pdf') {
                return (
                    <iframe src={documentUrl} className="preview-frame" title="Document Preview" />
                );
            } else {
                return (
                    <WordPreview fileUrl={documentUrl} full={true} />
                );
            }
        } else
        if (documentStep === 1 && documentUrl) {
            if (documentType === 'application/pdf') {
                return (
                    <iframe src={documentUrl} className="preview-frame" title="Document Preview" />
                );
            } else {
                return (
                    <WordPreview fileUrl={documentUrl} full={true} />
                );
            }
        } else if (documentStep === 2) {
            if (!fetchedSignerList) {
                fetchListSigners(editedDocument!.id);
                setFetchedSignerList(true);
            }
            return (
                <div className="document-settings">
                    <h2>{t('doc-settings')}</h2>

                    <div className="expiration-selector">
                        <label className="section-label">{t('exp-period')}:</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="expiration-field">
                                <label htmlFor="years-input" className="exp-input-label">
                                    {t('exp-years')}
                                </label>
                                <input
                                    id="years-input"
                                    type="number"
                                    min="0"
                                    value={expirationYears}
                                    onChange={(e) => setExpirationYears(Number(e.target.value))}
                                />
                            </div>
                            <div className="expiration-field">
                                <label htmlFor="months-input" className="exp-input-label">
                                    {t('exp-months')}
                                </label>
                                <input
                                    id="months-input"
                                    type="number"
                                    min="0"
                                    value={expirationMonths}
                                    onChange={(e) => setExpirationMonths(Number(e.target.value))}
                                />
                            </div>
                            <div className="expiration-field">
                                <label htmlFor="days-input" className="exp-input-label">
                                    {t('exp-days')}
                                </label>
                                <input
                                    id="days-input"
                                    type="number"
                                    min="0"
                                    value={expirationDays}
                                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                    <TagManager
                        userId={user!.id}
                        documentId={editedDocument!.id}
                        token={getAccessToken()}
                        onSelectedTagsChange={(tags) => setSelectedTags(tags)}
                    />
                    {/*<label><input type="checkbox" /> Confidential</label><br />*/}
                    {/*<label><input type="checkbox" /> Requires Signature</label><br />*/}
                    {/*<label><input type="checkbox" /> Send Notification</label><br />*/}
                    {/* Add more options as needed */}
                    <SignerList signers={signers} setSigners={setSigners} sequentialSigning={sequentialSigning} setSequentialSigning={setSequentialSigning} />
                </div>
            );
        } else if (selected === 'info'){
            return <UserProfilePanel user={user!}></UserProfilePanel>;
        } else if (selected === 'create') {
            return <UploadArea onUpload={handleDocumentUpload} />;
        } else if (selected === 'verify') {
            localStorage.setItem('prevPage', "/profile")
            navigate('/verify');
        } else if (openedDocument) {
            const isDocFile = openedDocument.contentType === 'application/msword' ||
                openedDocument.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

            const allSigned = Array.isArray(signersFromServer) &&
                signersFromServer.length > 0 &&
                signersFromServer.every(signer => signer.status === "SIGNED");

            const currentCanSign = (signersFromServer ?? []).some(signer =>
                signer.userId === user?.id &&
                signer.canSignNow &&
                signer.status !== "SIGNED"
            );

            return (
                <div className="preview-wrapper">
                    {isDocFile ? (
                        <WordPreview fileUrl={openedDocument.previewUrl} full={true} />
                    ) : (
                        <iframe src={openedDocument.previewUrl} title={openedDocument.name} className="preview-frame" />
                    )}
                    <div className="floating-btn-group">
                    {/* Sign button shown only if current user can sign */}
                    {currentCanSign && (
                        <>
                            <button className="floating-sign-btn" onClick={() => setShowSignModal(true)}>{t('sign-btn')}</button>
                            {showSignModal && openedDocument && (
                                <SignModal
                                    onClose={() => handleSigning()}
                                    openedDocument={openedDocument}
                                    guest={null}
                                />
                            )}
                        </>
                    )}

                    {/*{allSigned && (*/}
                        {(
                        <a
                            href={`http://localhost:8082/documents/${openedDocument.id}?download=true`}
                            className="floating-download-btn"
                            download
                        >
                            {t('download-btn')}
                        </a>
                    )}
                    </div>
                </div>
            );
        } else if (['Sent'].includes(selected || '')) {
            return (
                <PaperBasketSection
                    title={selected!}
                    items={documents}
                    onItemClick={(doc) => setOpenedDocument(doc)}
                />
            );
        } else if (['Drafts'].includes(selected || '')) {
            return (
                <PaperBasketSection
                    title={selected!}
                    items={drafts}
                    onItemClick={(doc) => handleEditSequence(doc)}
                />
            );
        } else if (['Closed'].includes(selected || '')) {
            return (
                <PaperBasketSection
                    title={selected!}
                    items={readyDocuments}
                    onItemClick={(doc) => setOpenedDocument(doc)}
                />
            );
        } else if (['Received'].includes(selected || '')) {
            return (
                <PaperBasketSection
                    title={selected!}
                    items={receivedDocuments}
                    onItemClick={(doc) => setOpenedDocument(doc)}
                />
            );
        } else if (selected === 'templates') {
            if (openedTemplate) {
                const isDoc = openedTemplate.contentType.includes('word');

                return (
                    <div className="preview-wrapper">
                        {isDoc ? (
                            <WordPreview fileUrl={openedTemplate.previewUrl} full={true} />
                        ) : (
                            <iframe src={openedTemplate.previewUrl} title={openedTemplate.name}
                                    className="preview-frame"/>
                        )}
                    </div>
                );
            }

            return (
                <PaperBasketSection
                    title="Templates"
                    items={templates}
                    onItemClick={handleTemplateClick}
                />
            )
        }
        else {
            return <div className="placeholder">{t('unselected-prompt')}</div>;
        }
    };

    const renderRightPanel = () => {
        if (uploadView && documentUrl){
            return (
                <div className="right-controls">
                    <button onClick={clearDocument}>{t('clear')}</button>
                    <input
                        type="text"
                        placeholder="Name your document"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                    />
                    <button onClick={() => proceedToDrafts()}>{t('proceed')}{loading && <span className="spinner" />}</button>
                </div>
            );
        }
        if (documentStep === 1 && documentUrl) {
            return (
                <div className="right-controls">
                    <button onClick={clearDocument}>{t('clear')}</button>
                    <input
                        type="text"
                        placeholder="Name your document"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        disabled={true}
                    />
                    <button onClick={() => setDocumentStep(2)}>{t('proceed')}</button>
                </div>
            );
        } else if (documentStep === 2) {
            return (
                <div className="right-controls">
                    <button onClick={() => setDocumentStep(1)}>{t('back-to-1')}</button>
                    <p><br></br>{t('almost-done')}</p>
                    <button onClick={saveEditedSigners}>{t('save-exit')}</button>
                    <button onClick={startApprovalProcess}>{t('finish')}{loading && <span className="spinner" />}</button>
                </div>
            );
        } else if (openedDocument) {
            return (
                <div className="right-controls">
                    <button className="back-button" onClick={() => clearDocument()}>{t('back-list-btn')}</button>
                    <h2 className='signHeader'>{openedDocument.name}</h2>
                    <p
                        className={
                            openedDocument.expirationDate &&
                            new Date(openedDocument.expirationDate) < new Date()
                                ? 'expired-text'
                                : ''
                        }
                    >
                        {t('exp-date')} : {openedDocument.expirationDate?.toString() ?? t('exp-undefined')}
                    </p>
                    <h3>{t('signees-title')}</h3>
                    <ul className="signer-list">
                        {(signersFromServer ?? []).map((signee, index) => {
                            const isYou = user?.id === signee.userId;
                            const waitingTurn = signee.status === "PENDING" && !signee.canSignNow;
                            const statusIcon = signee.status === "SIGNED" ? "✔️"
                                : signee.status === "DECLINED" ? "❌"
                                    : waitingTurn ? "🕓"
                                        : "⏳";

                            const statusText = signee.status === "SIGNED" ? t('status-signed')
                                : signee.status === "DECLINED" ? t('status-declined')
                                    : waitingTurn ? t('status-waiting')
                                        : t('status-pending');
                            return (
                                <li key={index} className={`signer-item ${waitingTurn ? "signer-disabled" : ""}`}>
                                    <div className="signer-main">
                                        <div className="signer-left">
                                            <strong className="signer-name">
                                                {isYou ? t('you') : signee.fullName}
                                            </strong>
                                            <div className="signer-info">
                                                <span className="signer-email">{signee.email}</span> |{" "}
                                                <span className="signer-position">{signee.position}</span>
                                            </div>
                                            {!isYou && (
                                                <div className="signer-actions">
                                                    <button>{t('edit-deputy')}</button>
                                                    <button>{t('contact')}</button>
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
        } else if (openedTemplate && templateFields.length > 0) {
            return (
                <div className="right-controls">
                    <button className="back-button" onClick={() => setOpenedTemplate(null)}>{t('back-btn')}</button>
                    <h2>{t('fill-template')}</h2>
                    {templateFields.map(field => (
                        <div key={field.name} className="field-input">
                            <label>{field.name}</label>
                            <input
                                type={field.type}
                                value={fieldValues[field.name] || ''}
                                onChange={(e) =>
                                    setFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))
                                }
                            />
                        </div>
                    ))}
                    <button onClick={async () => {
                        try {
                            const cleanedFieldValues = Object.fromEntries(
                                templateFields.map(field => {
                                    const rawValue = fieldValues[field.name];
                                    const valueToUse = rawValue?.trim() === '' || rawValue === undefined ? ' ' : rawValue;
                                    return [field.name, valueToUse];
                                })
                            );
                            console.log(cleanedFieldValues);

                            const res = await fetch(`http://localhost:8084/templates/${openedTemplate.id}/fill?uploaderId=`+user?.id, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(cleanedFieldValues),
                            });
                            if (!res.ok) throw new Error('Failed to submit');
                            alert(t('template-success'));
                            setOpenedTemplate(null);
                            clearDocument();
                            await fetchDocumentMetadata();
                            setSelected('Drafts');
                            setBasketOpen(true);
                        } catch (e) {
                            alert(t('template-error'));
                            console.error(e);
                        }
                    }}>
                        {t('submit-btn')}
                    </button>
                </div>
            );
        } else if (['Sent','Received','Closed'].includes(selected || '')) {
            return (
                <TagFilter
                    userId={user!.id}
                    token={getAccessToken()}
                    onChange={(selectedTags) => {
                        fetchDocumentMetadata(selectedTags);
                    }}
                />
            )
        }
        return null;
    };

    return (
        <div className="profile-page">
            {/* LEFT PANEL */}
            <div className="profile-nav">
                <div className="nav-logo">DocFlow</div>
                <div className="top-controls">
                <a className="back-button" href="/">{t('back-btn')}</a>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '' }}>
                    <LanguageSwitcher />
                </div>
                </div>
                {user && <div className="nav-logo">{user.firstName} {user.lastName}</div>}
                {documentStep ? (
                    <div className="step-header">
                        <p>📄 {t('doc-create-title')}</p>
                        <strong><br></br>{t('step')} {documentStep}: {documentStep === 1 ? t('step-verify') : t('step-setup')}</strong>
                    </div>
                ) : (
                    <>
                        <button onClick={() => handleSectionSelect('info')}
                                className={selected === 'info' ? 'active' : ''}>{t('nav-userinfo')}</button>
                        <button onClick={() => handleSectionSelect('create')}
                                className={selected === 'create' ? 'active' : ''}>{t('nav-create-doc')}</button>
                        <button onClick={() => handleSectionSelect('verify')}
                                className={selected === 'verify' ? 'active' : ''}>{t('nav-verify-doc')}</button>

                        <div className="dropdown">
                            <button
                                className={`dropdown-toggle ${basketOpen ? 'open' : ''}`}
                                onClick={() => setBasketOpen(!basketOpen)}
                            >
                                {t('nav-basket')}
                                <span className={`dropdown-icon ${basketOpen ? 'open' : ''}`}>▼</span>
                            </button>

                            <div className={`dropdown-content ${basketOpen ? 'open' : ''}`}>
                                {['Sent', 'Received', 'Closed', 'Drafts', 'Archive', 'Deleted'].map((item) => (
                                    <button
                                        key={item}
                                        className={selected === item ? 'active' : ''}
                                        onClick={() => handleSectionSelect(item)}
                                    >
                                        {t('nav-basket-'+item.toLowerCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => handleSectionSelect('templates')}
                                className={selected === 'templates' ? 'active' : ''}>{t('nav-templates')}</button>
                        <button onClick={() => handleSectionSelect('help')}
                                className={selected === 'help' ? 'active' : ''}>{t('nav-help')}</button>
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