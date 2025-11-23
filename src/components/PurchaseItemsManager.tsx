import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { PurchaseItem } from '../types';
import { capitalizeText } from '../utils/textFormat';
import styles from './PurchaseItemsManager.module.css';

interface PurchaseItemsManagerProps {
  items: PurchaseItem[];
  onItemsChange: (items: PurchaseItem[]) => void;
}

export const PurchaseItemsManager: React.FC<PurchaseItemsManagerProps> = ({ items, onItemsChange }) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const handleAddItem = () => {
    if (!itemName.trim() || !unitPrice) {
      return;
    }

    const qty = parseFloat(quantity) || 1;
    const price = parseFloat(unitPrice);

    if (price <= 0 || qty <= 0) {
      return;
    }

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      name: capitalizeText(itemName.trim()),
      quantity: qty,
      unitPrice: price,
      total: qty * price,
    };

    onItemsChange([...items, newItem]);
    setItemName('');
    setQuantity('1');
    setUnitPrice('');
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>Itens da Compra</h4>
        <span className={styles.totalBadge}>
          Total: R$ {calculateTotal().toFixed(2)}
        </span>
      </div>

      {/* Lista de itens */}
      {items.length > 0 && (
        <div className={styles.itemsList}>
          {items.map(item => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemDetails}>
                  {item.quantity}x R$ {item.unitPrice.toFixed(2)} = R$ {item.total.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className={styles.removeButton}
                title="Remover item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário para adicionar item */}
      <div className={styles.addForm}>
        <input
          type="text"
          placeholder="Nome do item"
          value={itemName}
          onChange={(e) => setItemName(capitalizeText(e.target.value))}
          onBlur={(e) => setItemName(capitalizeText(e.target.value))}
          className={styles.inputName}
        />
        <input
          type="number"
          placeholder="Qtd"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0.01"
          step="0.01"
          className={styles.inputQuantity}
        />
        <input
          type="number"
          placeholder="Preço unit."
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          min="0.01"
          step="0.01"
          className={styles.inputPrice}
        />
        <button
          type="button"
          onClick={handleAddItem}
          className={styles.addButton}
          title="Adicionar item"
        >
          <Plus size={18} />
        </button>
      </div>

      {items.length === 0 && (
        <p className={styles.emptyMessage}>
          Nenhum item adicionado. Adicione os produtos da compra acima.
        </p>
      )}
    </div>
  );
};
