import React, { useState, useRef, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuth } from '../context/AuthContext';
import "./SignerList.css";

export type Signer = {
    id: string;
    userId?: string;
    fullName: string;
    position: string;
    email: string;

    deputy? : Deputy;

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

    const [, drop] = useDrop({
        accept: ItemTypes.SIGNER,
        hover(item: { index: number }, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) return;

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current.getBoundingClientRect();
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;

            // Only perform the move when the mouse has crossed half of the item's height
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
                <button className="signerlist-button" onClick={() => onEdit(signer.id)}>Edit Signer</button>
                <button className="signerlist-button" onClick={() => onDelete(signer.id)}>Delete Signer</button>
                {/*<button className="signerlist-button" onClick={() => onOpenDeputy(signer.id)}>*/}
                {/*    Deputies ({signer.deputies.length})*/}
                {/*</button>*/}
                <button className="signerlist-button" onClick={() => onOpenDeputy(signer.id)}>
                    Deputy ({signer.deputy ? 1 : 0})
                </button>
            </div>
        </li>
    );
};

const SignerList: React.FC<SignerListProps> = ({ signers, setSigners , sequentialSigning, setSequentialSigning} ) => {
    const { user } = useAuth();
    useEffect(() => {
        if (user) {
            setSigners([{ id: generateId(), userId:user.id, fullName: user.firstName+" "+user.lastName, email: "", position: ""}]);
        }
    }, [user]);
    const [showSignerModal, setShowSignerModal] = useState(false);
    const [showDeputyModal, setShowDeputyModal] = useState(false);
    const [editingSignerId, setEditingSignerId] = useState<string | null>(null);
    const [editingDeputySignerId, setEditingDeputySignerId] = useState<string | null>(null);
    const [iWillSign, setIWillSign] = useState(true);

    // Form state for signer modal
    const [form, setForm] = useState({ fullName: "", email: "", position: ""});

    // Deputy editing form state
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
    // Move signer in list (for drag and drop)
    const moveSigner = (dragIndex: number, hoverIndex: number) => {
        setSigners((prevSigners) => {
            const newSigners = [...prevSigners];
            const [removed] = newSigners.splice(dragIndex, 1);
            newSigners.splice(hoverIndex, 0, removed);
            return assignOrderIfSequential(newSigners, sequentialSigning);
        });
    };

    const openSignerModal = (signerId?: string) => {
        if (signerId) {
            const signer = signers.find((s) => s.id === signerId)!;
            setForm({ fullName: signer.fullName, email: signer.email , position: signer.position });
            setEditingSignerId(signerId);
        } else {
            setForm({ fullName: "", email: "", position: "" });
            setEditingSignerId(null);
        }
        setShowSignerModal(true);
    };

    const saveSigner = () => {
        setSigners((prev) => {
            let updated;
            if (editingSignerId) {
                updated = prev.map((s) =>
                    s.id === editingSignerId ? { ...s, ...form } : s
                );
            } else {
                updated = [...prev, { ...form, id: generateId() }];
            }
            return assignOrderIfSequential(updated, sequentialSigning);
        });
        setShowSignerModal(false);
    };

    const deleteSigner = (id: string) => {
        setSigners((prev) =>
            assignOrderIfSequential(
                prev.filter((s) => s.id !== id),
                sequentialSigning
            )
        );
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
                s.id === editingDeputySignerId ? { ...s, deputy: undefined } : s
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
        if (iWillSign) {
            setSigners((prev) =>
                assignOrderIfSequential(
                    prev.filter((s) => s.userId !== user?.id),
                    sequentialSigning
                )
            );
            setIWillSign(false);
        } else {
            if (user) {
                setSigners((prev) =>
                    assignOrderIfSequential(
                        [...prev, {
                            id: generateId(),
                            userId: user.id,
                            fullName: user.firstName+" "+user.lastName,
                            email: "",
                            position: ""
                        }],
                        sequentialSigning
                    )
                );
            }
            setIWillSign(true);
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="signer-list-container">
                <h3 className="signerlist-h3">Signers</h3>

                <div className="signerlist-checkboxes">
                    <label>
                        <input className="signerlist-input" type="checkbox" checked={iWillSign} onChange={toggleIWillSign} /> I will sign
                    </label>
                    <label>
                        <input className="signerlist-input"
                               type="checkbox"
                               checked={sequentialSigning}
                               onChange={() => setSequentialSigning(!sequentialSigning)}
                        /> Sequential signing
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

                <button className="signerlist-button" onClick={() => openSignerModal()}>Add Signer</button>

                {/* Signer Modal */}
                {showSignerModal && (
                    <div className="signerlist-modal">
                        <div className="signerlist-modal-content">
                            <h4>{editingSignerId ? "Edit Signer" : "Add Signer"}</h4>
                            <input className="signerlist-input"
                                   placeholder="Name"
                                   value={form.fullName}
                                   onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            />
                            <input className="signerlist-input"
                                   placeholder="Email"
                                   value={form.email}
                                   onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            <input className="signerlist-input"
                                   placeholder="Position"
                                   value={form.position}
                                   onChange={(e) => setForm({ ...form, position: e.target.value })}
                            />
                            <button className="signerlist-button" onClick={saveSigner}>Save</button>
                            <button className="signerlist-button" onClick={() => setShowSignerModal(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Deputy Modal */}
                {showDeputyModal && editingDeputySignerId && (
                    <div className="signerlist-modal">
                        <div className="signerlist-modal-content">
                            <h4>Deputies for Signer</h4>
                            <ul>
                                {(() => {
                                    const signer = signers.find((s) => s.id === editingDeputySignerId);
                                    const deputy = signer?.deputy;
                                    return deputy ? [deputy].map((d) => (
                                        <li key={d.id}>
                                            {d.name} ({d.email})
                                            <button className="signerlist-button" onClick={() => startEditDeputy()}>Edit</button>
                                            <button className="signerlist-button" onClick={() => deleteDeputy()}>Delete</button>
                                        </li>
                                    )) : null;
                                })()}
                                    {/* .deputies.map((d) => (*/}
                                    {/*     <li key={d.id}>*/}
                                    {/*         {d.name} ({d.iin})*/}
                                    {/*         <button className="signerlist-button" onClick={() => startEditDeputy(d)}>Edit</button>*/}
                                    {/*         <button className="signerlist-button"onClick={() => deleteDeputy(d.id)}>Delete</button>*/}
                                    {/*     </li>*/}
                                    {/* ))}*/}
                            </ul>

                            <h5>{isEditingDeputy ? "Edit Deputy" : "Add Deputy"}</h5>
                            <input className="signerlist-input"
                                   placeholder="Name"
                                   value={deputyForm.name}
                                   onChange={(e) => setDeputyForm({ ...deputyForm, name: e.target.value })}
                            />
                            <input className="signerlist-input"
                                   placeholder="Email"
                                   value={deputyForm.email}
                                   onChange={(e) => setDeputyForm({ ...deputyForm, email: e.target.value })}
                            />
                            <button className="signerlist-button" onClick={addOrEditDeputy}>{isEditingDeputy ? "Save" : "Add"}</button>
                            <button className="signerlist-button"
                                    onClick={() => {
                                        setShowDeputyModal(false);
                                        setIsEditingDeputy(false);
                                        setDeputyForm({ name: "", email: "" });
                                    }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DndProvider>
    );
};

export default SignerList;