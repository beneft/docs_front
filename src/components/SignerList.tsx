import React, { useState, useRef, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuth } from '../context/AuthContext';
import "./SignerList.css";
import { useTranslation } from 'react-i18next';

export type Signer = {
    id: string;
    userId?: string | null;
    fullName: string;
    position: string;
    email: string;
    iin: string

    deputy? : Deputy | null;

    status?: string;
    order?: number;
};

type SignerListProps = {
    signers: Signer[];
    setSigners: React.Dispatch<React.SetStateAction<Signer[]>>;
    sequentialSigning: boolean;
    setSequentialSigning: React.Dispatch<React.SetStateAction<boolean>>;
};

type Deputy = {
    id: string;
    name: string;
    email: string;
};

function generateId() {
    return '-'+Math.random().toString(36).substr(2, 9);
}

const ItemTypes = {
    SIGNER: "signer",
};

type DraggableSignerProps = {
    signer: Signer;
    index: number;
    moveSigner: (dragIndex: number, hoverIndex: number) => void;
    isDragDisabled: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onOpenDeputy: (id: string) => void;
};

const DraggableSigner: React.FC<DraggableSignerProps> = ({
                                                             signer,
                                                             index,
                                                             moveSigner,
                                                             isDragDisabled,
                                                             onEdit,
                                                             onDelete,
                                                             onOpenDeputy,
                                                         }) => {
    const ref = useRef<HTMLLIElement>(null);
    const { t } = useTranslation('signerlist');

    const [, drop] = useDrop({
        accept: ItemTypes.SIGNER,
        hover(item: { index: number }, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) return;

            const hoverBoundingRect = ref.current.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;

            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

            moveSigner(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemTypes.SIGNER,
        item: { id: signer.id, index },
        canDrag: !isDragDisabled,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(drop(ref));

    return (
        <li
            ref={ref}
            className={`signers-item ${isDragging ? "dragging" : ""} ${
                isDragDisabled ? "no-drag" : ""
            }`}
            style={{ opacity: isDragging ? 0.5 : 1, cursor: isDragDisabled ? "default" : "move" }}
        >
            <div className="signers-header">
                <span className="signers-name">{signer.fullName}</span>
                {!isDragDisabled && <span className="drag-handle" title="Drag to reorder">⠿</span>}
            </div>

            <div className="signers-buttons">
                <button className="signerlist-button" onClick={() => onEdit(signer.id)}>{t('edit-signer')}</button>
                <button className="signerlist-button" onClick={() => onDelete(signer.id)}>{t('delete-signer')}</button>
                {/*<button className="signerlist-button" onClick={() => onOpenDeputy(signer.id)}>*/}
                {/*    Deputies ({signer.deputies.length})*/}
                {/*</button>*/}
                <button className="signerlist-button" onClick={() => onOpenDeputy(signer.id)}>
                    {t('deputy-btn')} ({signer.deputy ? 1 : 0})
                </button>
            </div>
        </li>
    );
};

const SignerList: React.FC<SignerListProps> = ({ signers, setSigners , sequentialSigning, setSequentialSigning} ) => {
    const { user } = useAuth();
    const { t } = useTranslation('signerlist');
    const [fetchedSigners, setFetchedSigners] = useState(false);
    useEffect(() => {
        console.log(signers);
        setFetchedSigners(false);
        if (user && signers.length === 0) {
            const selfSigner = {
                id: generateId(),
                userId: user.id,
                fullName: `${user.lastName} ${user.firstName}`,
                email: user.email,
                position: user.position || "",
                iin: user.iin || ""
            };
            setSigners([selfSigner]);
            setIWillSign(true);
            setFetchedSigners(true);
        } else if (user && signers.length > 0 && !fetchedSigners) {
            const isCurrentUserSigner = signers.some(signer => signer.userId === user!.id);
            const isSequential = signers.every(signer => signer.order !== -1 && signer.order !== undefined);

            setIWillSign(isCurrentUserSigner);
            setSequentialSigning(isSequential);
            setFetchedSigners(true);
        }
    }, [user, signers.length, setSigners]);
    const [showSignerModal, setShowSignerModal] = useState(false);
    const [showDeputyModal, setShowDeputyModal] = useState(false);
    const [editingSignerId, setEditingSignerId] = useState<string | null>(null);
    const [editingDeputySignerId, setEditingDeputySignerId] = useState<string | null>(null);
    const [iWillSign, setIWillSign] = useState(true);
    const [findMessage, setFindMessage] = useState<string | null>(null);
    const [foundUserId, setFoundUserId] = useState<string | null>(null);

    const [form, setForm] = useState({ fullName: "", email: "", position: "", iin: ""});

    const [deputyForm, setDeputyForm] = useState({ name: "", email: "" });
    const [isEditingDeputy, setIsEditingDeputy] = useState(false);

    useEffect(() => {
        setSigners((prev) => assignOrderIfSequential(prev, sequentialSigning));
    }, [sequentialSigning]);
    const assignOrderIfSequential = (signers: Signer[], sequential: boolean): Signer[] => {
        return sequential
            ? signers.map((s, i) => ({ ...s, order: i }))
            : signers.map(s => {
                const { order, ...rest } = s;
                return rest; // remove order if not sequential
            });
    };
    // (for drag and drop)
    const moveSigner = (dragIndex: number, hoverIndex: number) => {
        setSigners((prevSigners) => {
            const newSigners = [...prevSigners];
            const [removed] = newSigners.splice(dragIndex, 1);
            newSigners.splice(hoverIndex, 0, removed);
            return assignOrderIfSequential(newSigners, sequentialSigning);
        });
    };

    const openSignerModal = (signerId?: string) => {
        setFoundUserId(null);
        setFindMessage(null);
        if (signerId) {
            const signer = signers.find((s) => s.id === signerId)!;
            setForm({ fullName: signer.fullName, email: signer.email , position: signer.position, iin: signer.iin });
            setEditingSignerId(signerId);
        } else {
            setForm({ fullName: "", email: "", position: "", iin: "" });
            setEditingSignerId(null);
        }
        setShowSignerModal(true);
    };

    const findUserByEmail = async () => {
        try {
            const response = await fetch(`http://localhost:8081/api/profile/by-email?email=${encodeURIComponent(form.email)}&exact=true`);
            if (!response.ok) throw new Error(t('user-not-found'));
            const data = await response.json();
            setForm({
                fullName: data.lastName + " " + data.firstName,
                email: data.email,
                position: data.position || "",
                iin: data.iin || ""
            });
            setFoundUserId(data.id);
            setFindMessage("✅ " + t('user-found'));
        } catch (error) {
            setFindMessage("❌ " + t('user-not-found'));
        }
    };

    const findUserByIIN = async () => {
        try {
            const response = await fetch(`http://localhost:8081/api/profile/by-iin?iin=${encodeURIComponent(form.iin)}`);
            if (!response.ok) throw new Error(t('user-not-found'));
            const data = await response.json();
            setForm({
                fullName: data.lastName + " " + data.firstName,
                email: data.email,
                position: data.position || "",
                iin: data.iin || ""
            });
            setFoundUserId(data.id);
            setFindMessage("✅ " + t('user-found'));
        } catch (error) {
            setFindMessage("❌ " + t('user-not-found'));
        }
    };

    const saveSigner = () => {
        setSigners((prev) => {
            let updated;
            if (editingSignerId) {
                updated = prev.map((s) =>
                    s.id === editingSignerId ? { ...s, ...form } : s
                );
            } else {
                updated = [...prev, { ...form, userId:foundUserId, id: generateId() }];
            }
            return assignOrderIfSequential(updated, sequentialSigning);
        });
        setShowSignerModal(false);
    };

    const deleteSigner = (id: string) => {
        setSigners((prev) => {
            const updated = prev.filter((s) => s.id !== id);
            const reassigned = assignOrderIfSequential(updated, sequentialSigning);
            if (user && !reassigned.some(s => s.userId === user.id)) {
                setIWillSign(false);
            }
            if (reassigned.length === 0 && user) {
                const selfSigner = {
                    id: generateId(),
                    userId: user.id,
                    fullName: `${user.lastName} ${user.firstName}`,
                    email: user.email,
                    position: user.position || "",
                    iin: user.iin || ""
                };
                setIWillSign(true);
                return [selfSigner];
            }
            return reassigned;
        });
    };

    const openDeputyModal = (signerId: string) => {
        console.log(signers);
        setEditingDeputySignerId(signerId);
        setShowDeputyModal(true);
        setDeputyForm({ name: "", email: "" });
        setIsEditingDeputy(false);
    };

    const addOrEditDeputy = () => {
        if (!editingDeputySignerId) return;
        setSigners((prev) =>
            prev.map((s) => {
                if (s.id !== editingDeputySignerId) return s;
                return {
                    ...s,
                    deputy: { ...deputyForm, id: s.deputy?.id ?? generateId() },
                };
            })
        );
        setDeputyForm({ name: "", email: "" });
        setIsEditingDeputy(false);
    };

    const deleteDeputy = () => {
        if (!editingDeputySignerId) return;
        setSigners((prev) =>
            prev.map((s) =>
                s.id === editingDeputySignerId ? { ...s, deputy: null } : s
            )
        );
    };

    const startEditDeputy = () => {
        const signer = signers.find((s) => s.id === editingDeputySignerId);
        if (signer?.deputy) {
            setDeputyForm(signer.deputy);
            setIsEditingDeputy(true);
        }
    };

    const toggleIWillSign = () => {
        setIWillSign(prev => {
            const newValue = !prev;
            setSigners(prev => {
                let updated;
                if (newValue) {
                    if (user && !prev.some(s => s.userId === user.id)) {
                        const selfSigner = {
                            id: generateId(),
                            userId: user.id,
                            fullName: `${user.lastName} ${user.firstName}`,
                            email: user.email,
                            position: user.position || "",
                            iin: user.iin || ""
                        };
                        updated = [...prev, selfSigner];
                    } else {
                        updated = [...prev];
                    }
                } else {
                    updated = prev.filter(s => s.userId !== user?.id);
                }

                return assignOrderIfSequential(updated, sequentialSigning);
            });
            return newValue;
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="signer-list-container">
                <h3 className="signerlist-h3">{t('signers.title')}</h3>

                <div className="signerlist-checkboxes">
                    <label>
                        <input className="signerlist-input" type="checkbox" checked={iWillSign} onChange={toggleIWillSign} />
                        {t('signers.iWillSign')}
                    </label>
                    <label>
                        <input
                            className="signerlist-input"
                            type="checkbox"
                            checked={sequentialSigning}
                            onChange={() => setSequentialSigning(!sequentialSigning)}
                        />
                        {t('signers.sequentialSigning')}
                    </label>
                </div>

                <ul className="signers-list">
                    {signers.map((signer, index) => (
                        <DraggableSigner
                            key={signer.id}
                            signer={signer}
                            index={index}
                            moveSigner={moveSigner}
                            isDragDisabled={!sequentialSigning}
                            onEdit={openSignerModal}
                            onDelete={deleteSigner}
                            onOpenDeputy={openDeputyModal}
                        />
                    ))}
                </ul>

                <button className="signerlist-button" onClick={() => openSignerModal()}>
                    {t('signers.addSigner')}
                </button>

                {/* Signer Modal */}
                {showSignerModal && (
                    <div className="signerlist-modal">
                        <div className="signerlist-modal-content">
                            <h4>{editingSignerId ? t('signers.editSigner') : t('signers.addSigner')}</h4>
                            <input
                                className="signerlist-input"
                                placeholder={t('signers.name')}
                                value={form.fullName}
                                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            />
                            <input
                                className="signerlist-input"
                                placeholder={t('signers.email')}
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            <button onClick={findUserByEmail}>{t('signers.findByEmail')}</button>
                            <input
                                className="signerlist-input"
                                placeholder={t('signers.iin')}
                                value={form.iin}
                                onChange={(e) => setForm({ ...form, iin: e.target.value })}
                            />
                            <button onClick={findUserByIIN}>{t('signers.findByIIN')}</button>
                            <input
                                className="signerlist-input"
                                placeholder={t('signers.position')}
                                value={form.position}
                                onChange={(e) => setForm({ ...form, position: e.target.value })}
                            />

                            {findMessage && <p>{findMessage}</p>}

                            <button className="signerlist-button" onClick={saveSigner}>
                                {t('signers.save')}
                            </button>
                            <button className="signerlist-button" onClick={() => setShowSignerModal(false)}>
                                {t('signers.cancel')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Deputy Modal */}
                {showDeputyModal && editingDeputySignerId && (
                    <div className="signerlist-modal">
                        <div className="signerlist-modal-content">
                            <h4>{t('deputy.forSigner')}</h4>
                            <ul>
                                {(() => {
                                    const signer = signers.find((s) => s.id === editingDeputySignerId);
                                    const deputy = signer?.deputy;
                                    return deputy ? [deputy].map((d) => (
                                        <li key={d.id}>
                                            {d.name} ({d.email})
                                            <button className="signerlist-button" onClick={() => startEditDeputy()}>
                                                {t('deputy.edit')}
                                            </button>
                                            <button className="signerlist-button" onClick={() => deleteDeputy()}>
                                                {t('deputy.delete')}
                                            </button>
                                        </li>
                                    )) : null;
                                })()}
                                {/* .deputies.map((d) => (
                             <li key={d.id}>
                                 {d.name} ({d.iin})
                                 <button className="signerlist-button" onClick={() => startEditDeputy(d)}>Edit</button>
                                 <button className="signerlist-button"onClick={() => deleteDeputy(d.id)}>Delete</button>
                             </li>
                         ))*/}
                            </ul>

                            <h5>{isEditingDeputy ? t('deputy.editDeputy') : t('deputy.addDeputy')}</h5>
                            <input
                                className="signerlist-input"
                                placeholder={t('signers.name')}
                                value={deputyForm.name}
                                onChange={(e) => setDeputyForm({ ...deputyForm, name: e.target.value })}
                            />
                            <input
                                className="signerlist-input"
                                placeholder={t('signers.email')}
                                value={deputyForm.email}
                                onChange={(e) => setDeputyForm({ ...deputyForm, email: e.target.value })}
                            />
                            <button className="signerlist-button" onClick={addOrEditDeputy}>
                                {isEditingDeputy ? t('deputy.save') : t('deputy.add')}
                            </button>
                            <button
                                className="signerlist-button"
                                onClick={() => {
                                    setShowDeputyModal(false);
                                    setIsEditingDeputy(false);
                                    setDeputyForm({ name: "", email: "" });
                                }}
                            >
                                {t('deputy.close')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DndProvider>
    );
};

export default SignerList;