import React, { useState, useEffect, useRef } from 'react';
import './SignModal.css';
import { signDocumentWithNCALayer } from './NCALayerSigner';
import { DocumentItem } from './PaperBasketSection';
import { useAuth } from "../context/AuthContext";
import { useTranslation } from 'react-i18next';

const SignModal = ({
                       onClose,
                       openedDocument,
                       guest
                   }: {
    onClose: () => void;
    openedDocument: DocumentItem;
    guest: string | null;
}) => {
    const { t } = useTranslation('signmodal');
    const [tab, setTab] = useState<'eds' | 'qr'>('eds');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
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
                    <button className={tab === 'eds' ? 'active' : ''} onClick={() => setTab('eds')}>
                        {t('edsTab')}
                    </button>
                    <button className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}>
                        {t('qrTab')}
                    </button>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>
                <div className="sign-modal-body">
                    {tab === 'eds' ? (
                        <div className="eds-tab">
                            <div className="eds-description">
                                <p><strong>{t('instructionsLabel')}</strong> {t('instructionsText')}</p>
                            </div>
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
                                                let signature = await signDocumentWithNCALayer(base64);
                                                console.log("Signature:", signature);

                                                if (signature != null) {
                                                    signature = signature
                                                        .replace(/-----BEGIN CMS-----/, '')
                                                        .replace(/-----END CMS-----/, '')
                                                        .replace(/\s+/g, '');

                                                    const response = await fetch('http://localhost:8083/approval/sign', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            documentId: openedDocument.id,
                                                            authorId: guest ? "-1" : user?.id,
                                                            authorName: guest ? guest : (user?.firstName + " " + user?.lastName),
                                                            cms: signature
                                                        })
                                                    });

                                                    if (!response.ok) {
                                                        throw new Error(`Failed to post signature: HTTP ${response.status}`);
                                                    }
                                                    onClose();
                                                }
                                            } catch (err) {
                                                alert(t('signError'));
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
                                {t('openNCA')}
                                {loading && <span className="spinner" />}
                            </button>
                        </div>
                    ) : (
                        <div className="qr-tab">
                            <p>{t('qrInstructions')}</p>
                            <div className="qr-placeholder">{t('qrPlaceholder')}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignModal;