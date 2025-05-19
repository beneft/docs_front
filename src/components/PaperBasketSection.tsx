
import './PaperBasketSection.css';
import WordPreview from './WordPreview';


export interface DocumentItem {
    id: string;
    name: string;
    contentType: string;
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
                {items.map((doc) => {
                    const isDocFile = doc.contentType.includes('msword') || doc.contentType.includes('officedocument.wordprocessingml.document');

                    return (
                        <div key={doc.id} className="document-item" onClick={() => onItemClick?.(doc)}>
                            {isDocFile ? (
                                <WordPreview fileUrl={doc.previewUrl} full={false} />
                            ) : (
                                <iframe src={doc.previewUrl} title={doc.name} className="doc-preview" />
                            )}
                            <div className="doc-name">{doc.name}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PaperBasketSection;