
import './PaperBasketSection.css';

export interface DocumentItem {
    id: string;
    name: string;
    previewUrl: string;
}

interface PaperBasketSectionProps {
    title: string;
    items: DocumentItem[];
    onItemClick?: (item: DocumentItem) => void;
}

const PaperBasketSection: React.FC<PaperBasketSectionProps> = ({ title, items, onItemClick }) => {
    return (
        <div className="paper-basket-section">
            <h2>{title}</h2>
            <div className="document-grid">
                {items.map((doc) => (
                    <div key={doc.id} className="document-item" onClick={() => onItemClick?.(doc)}>
                        <iframe src={doc.previewUrl} title={doc.name} className="doc-preview" />
                        <div className="doc-name">{doc.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaperBasketSection;