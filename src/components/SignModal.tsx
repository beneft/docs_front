import React, { useState, useEffect, useRef } from 'react';
import './SignModal.css';
import { signDocumentWithNCALayer } from './NCALayerSigner';
import { DocumentItem } from './PaperBasketSection';

const SignModal = ({
                       onClose,
                       openedDocument,
                   }: {
    onClose: () => void;
    openedDocument: DocumentItem;
}) => {
    const [tab, setTab] = useState<'eds' | 'qr'>('eds');
    const [loading, setLoading] = useState(false);
    const openedDocumentBlob = useRef<Blob | null>(null);

    useEffect(() => {
        if (openedDocument) {
            fetch(openedDocument.previewUrl)
                .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
                .then(blob => {
                    openedDocumentBlob.current = blob;
                })
                .catch(err => {
                    console.error("Failed to fetch document:", err);
                })
        }
    }, [openedDocument]);

    return (
        <div className="sign-modal-overlay">
            <div className="sign-modal">
                <div className="sign-modal-header">
                    <button className={tab === 'eds' ? 'active' : ''} onClick={() => setTab('eds')}>EDS</button>
                    <button className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}>eGov QR</button>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>
                <div className="sign-modal-body">
                    {tab === 'eds' ? (
                        <div className="eds-tab">
                            <div className="eds-description">
                            <p><strong>Name:</strong> John Doe</p>
                            <p><strong>Position:</strong> Manager</p>
                            <p><strong>INN:</strong> 123456789012</p>
                            <p><strong>Organization:</strong> Example Inc.</p></div>
                            <button
                                className="open-nca-btn"
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const blob = openedDocumentBlob.current;
                                        if (!blob) throw new Error("No document loaded.");

                                        const reader = new FileReader();
                                        reader.onload = async () => {
                                            try {
                                                const base64 = (reader.result as string).split(',')[1];
                                                const signature = await signDocumentWithNCALayer(base64);
                                                console.log("Signature:", signature);

                                                const response = await fetch('http://localhost:8083/signatures', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        documentId: openedDocument.id,
                                                        signature: signature
                                                    })
                                                });

                                                if (!response.ok) {
                                                    throw new Error(`Failed to post signature: HTTP ${response.status}`);
                                                }
                                                onClose();
                                            } catch (err) {
                                                console.error("Signing or posting failed:", err);
                                            } finally {
                                                setLoading(false);
                                            }
                                        };
                                        reader.readAsDataURL(blob);
                                    } catch (err) {
                                        console.error("Preparation failed:", err);
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                            >
                                Open NCALayer
                                {loading && <span className="spinner" />}
                            </button>
                        </div>
                    ) : (
                        <div className="qr-tab">
                            <p>Scan this QR code with your mobile eGov app to sign the document:</p>
                            <div className="qr-placeholder">[QR CODE]</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignModal;