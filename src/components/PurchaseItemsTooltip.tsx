import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { PurchaseItem } from '../types';
import styles from './PurchaseItemsTooltip.module.css';

interface PurchaseItemsTooltipProps {
  items: PurchaseItem[];
  totalAmount: number;
}

export const PurchaseItemsTooltip: React.FC<PurchaseItemsTooltipProps> = ({ items, totalAmount }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div 
      className={styles.container}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className={styles.trigger}>
        <ShoppingBag size={16} className={styles.icon} />
        <span className={styles.badge}>{items.length}</span>
      </div>

      {isVisible && (
        <div className={styles.tooltip}>
          <div className={styles.header}>
            <h4>Itens da Compra</h4>
            <span className={styles.itemCount}>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
          </div>

          <div className={styles.itemsList}>
            {items.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemDetails}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQuantity}>
                    {item.quantity}x R$ {item.unitPrice.toFixed(2)}
                  </span>
                </div>
                <span className={styles.itemTotal}>
                  R$ {item.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <span className={styles.totalLabel}>Total:</span>
            <span className={styles.totalValue}>R$ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
