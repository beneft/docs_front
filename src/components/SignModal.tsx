import React, { useState } from 'react';
import './SignModal.css';
import { signDocumentWithNCALayer } from './NCALayerSigner';

const SignModal = ({ onClose }: { onClose: () => void }) => {
    const [tab, setTab] = useState<'eds' | 'qr'>('eds');
    const [loading, setLoading] = useState(false);

    return (
        <div className="sign-modal-overlay">
            <div className="sign-modal">
                <div className="sign-modal-header">
                    <button className={tab === 'eds' ? 'active' : ''} onClick={() => setTab('eds')}>EDS</button>
                    <button className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}>rGov QR</button>
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
                                        const base64Data = await new Promise<string>((resolve, reject) => {
                                            const dummyContent = "Hello, this is a test document.";
                                            const blob = new Blob([dummyContent], { type: "application/pdf" });
                                            const reader = new FileReader();
                                            reader.onload = () => resolve((reader.result as string).split(',')[1]);
                                            reader.onerror = reject;
                                            reader.readAsDataURL(blob);
                                        });

                                        const signature = await signDocumentWithNCALayer(base64Data);
                                        if (signature) {
                                            console.log("Подпись получена:", signature);
                                            // TODO: send or save signature
                                        }
                                    } catch (err) {
                                        console.error(err);
                                    } finally {
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
                            <p>Scan this QR code with your mobile rGov app to sign the document:</p>
                            <div className="qr-placeholder">[QR CODE]</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignModal;