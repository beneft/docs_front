import React, { useState, useRef, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuth } from '../context/AuthContext';
import "./SignerList.css";

export type Signer = {
    id: string;
    name: string;
    iin: string;
    phone: string;
    email: string;
    deputies: Deputy[];
};

type SignerListProps = {
    signers: Signer[];
    setSigners: React.Dispatch<React.SetStateAction<Signer[]>>;
};

type Deputy = {
    id: string;
    name: string;
    iin: string;
    phone: string;
    email: string;
};

function generateId() {
    return Math.random().toString(36).substr(2, 9);
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
                <span className="signers-name">{signer.name}</span>
                {!isDragDisabled && <span className="drag-handle" title="Drag to reorder">⠿</span>}
            </div>

            <div className="signers-buttons">
                <button className="signerlist-button" onClick={() => onEdit(signer.id)}>Edit Signer</button>
                <button className="signerlist-button" onClick={() => onDelete(signer.id)}>Delete Signer</button>
                <button className="signerlist-button" onClick={() => onOpenDeputy(signer.id)}>
                    Deputies ({signer.deputies.length})
                </button>
            </div>
        </li>
    );
};

const SignerList: React.FC<SignerListProps> = ({ signers, setSigners }) => {
    const { user } = useAuth();
    useEffect(() => {
        if (user) {
            setSigners([{ id: user.id.toString(), name: user.name, iin: "", phone: "", email: "", deputies: [] }]);
        }
    }, [user]);
    const [showSignerModal, setShowSignerModal] = useState(false);
    const [showDeputyModal, setShowDeputyModal] = useState(false);
    const [editingSignerId, setEditingSignerId] = useState<string | null>(null);
    const [editingDeputySignerId, setEditingDeputySignerId] = useState<string | null>(null);
    const [sequentialSigning, setSequentialSigning] = useState(false);
    const [iWillSign, setIWillSign] = useState(true);

    // Form state for signer modal
    const [form, setForm] = useState({ name: "", iin: "", phone: "", email: "" });

    // Deputy editing form state
    const [deputyForm, setDeputyForm] = useState({ id: "", name: "", iin: "", phone: "", email: "" });
    const [isEditingDeputy, setIsEditingDeputy] = useState(false);

    // Move signer in list (for drag and drop)
    const moveSigner = (dragIndex: number, hoverIndex: number) => {
        setSigners((prevSigners) => {
            const newSigners = [...prevSigners];
            const [removed] = newSigners.splice(dragIndex, 1);
            newSigners.splice(hoverIndex, 0, removed);
            return newSigners;
        });
    };

    const openSignerModal = (signerId?: string) => {
        if (signerId) {
            const signer = signers.find((s) => s.id === signerId)!;
            setForm({ name: signer.name, iin: signer.iin, phone: signer.phone, email: signer.email });
            setEditingSignerId(signerId);
        } else {
            setForm({ name: "", iin: "", phone: "", email: "" });
            setEditingSignerId(null);
        }
        setShowSignerModal(true);
    };

    const saveSigner = () => {
        if (editingSignerId) {
            setSigners((prev) =>
                prev.map((s) => (s.id === editingSignerId ? { ...s, ...form } : s))
            );
        } else {
            setSigners((prev) => [...prev, { ...form, id: generateId(), deputies: [] }]);
        }
        setShowSignerModal(false);
    };

    const deleteSigner = (id: string) => {
        setSigners((prev) => prev.filter((s) => s.id !== id));
    };

    const openDeputyModal = (signerId: string) => {
        setEditingDeputySignerId(signerId);
        setShowDeputyModal(true);
        setDeputyForm({ id: "", name: "", iin: "", phone: "", email: "" });
        setIsEditingDeputy(false);
    };

    const addOrEditDeputy = () => {
        if (!editingDeputySignerId) return;
        setSigners((prev) =>
            prev.map((s) => {
                if (s.id !== editingDeputySignerId) return s;
                if (isEditingDeputy) {
                    return {
                        ...s,
                        deputies: s.deputies.map((d) =>
                            d.id === deputyForm.id ? { ...deputyForm } : d
                        ),
                    };
                } else {
                    return {
                        ...s,
                        deputies: [...s.deputies, { ...deputyForm, id: generateId() }],
                    };
                }
            })
        );
        setDeputyForm({ id: "", name: "", iin: "", phone: "", email: "" });
        setIsEditingDeputy(false);
    };

    const deleteDeputy = (deputyId: string) => {
        if (!editingDeputySignerId) return;
        setSigners((prev) =>
            prev.map((s) =>
                s.id === editingDeputySignerId
                    ? { ...s, deputies: s.deputies.filter((d) => d.id !== deputyId) }
                    : s
            )
        );
    };

    const startEditDeputy = (deputy: Deputy) => {
        setDeputyForm(deputy);
        setIsEditingDeputy(true);
    };

    const toggleIWillSign = () => {
        if (iWillSign) {
            setSigners((prev) => prev.filter((s) => s.id !== user?.id.toString()));
            setIWillSign(false);
        } else {
            if (user) {
                setSigners((prev) => [
                    ...prev,
                    {id: user?.id.toString(), name: user?.name, iin: "", phone: "", email: "", deputies: []},
                ]);
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
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <input className="signerlist-input"
                                placeholder="IIN"
                                value={form.iin}
                                onChange={(e) => setForm({ ...form, iin: e.target.value })}
                            />
                            <input className="signerlist-input"
                                placeholder="Phone"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                            <input className="signerlist-input"
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                                {signers
                                    .find((s) => s.id === editingDeputySignerId)!
                                    .deputies.map((d) => (
                                        <li key={d.id}>
                                            {d.name} ({d.iin})
                                            <button className="signerlist-button" onClick={() => startEditDeputy(d)}>Edit</button>
                                            <button className="signerlist-button"onClick={() => deleteDeputy(d.id)}>Delete</button>
                                        </li>
                                    ))}
                            </ul>

                            <h5>{isEditingDeputy ? "Edit Deputy" : "Add Deputy"}</h5>
                            <input className="signerlist-input"
                                placeholder="Name"
                                value={deputyForm.name}
                                onChange={(e) => setDeputyForm({ ...deputyForm, name: e.target.value })}
                            />
                            <input className="signerlist-input"
                                placeholder="IIN"
                                value={deputyForm.iin}
                                onChange={(e) => setDeputyForm({ ...deputyForm, iin: e.target.value })}
                            />
                            <input className="signerlist-input"
                                placeholder="Phone"
                                value={deputyForm.phone}
                                onChange={(e) => setDeputyForm({ ...deputyForm, phone: e.target.value })}
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
                                    setDeputyForm({ id: "", name: "", iin: "", phone: "", email: "" });
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