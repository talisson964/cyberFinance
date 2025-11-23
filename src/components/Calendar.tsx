import React, { useMemo, useState } from 'react';
import ReactCalendar from 'react-calendar';
import { useCaixa } from '../context/CaixaContext';
import { formatCurrency } from '../utils/calculations';
import 'react-calendar/dist/Calendar.css';
import styles from './Calendar.module.css';

type ValueType = Date | null;

export const CalendarSchedule: React.FC = () => {
  const { movements } = useCaixa();
  const [selectedDate, setSelectedDate] = useState<ValueType>(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Mapear todas as datas importantes
  const importantDates = useMemo(() => {
    const dateMap = new Map<string, { type: 'receivable' | 'payable', events: any[] }>();

    movements.forEach(movement => {
      // Adicionar data do movimento
      const movDate = new Date(movement.date);
      const movDateKey = movDate.toISOString().split('T')[0];
      
      if (!dateMap.has(movDateKey)) {
        dateMap.set(movDateKey, {
          type: movement.type === 'entrada' ? 'receivable' : 'payable',
          events: []
        });
      }
      
      const movEntry = dateMap.get(movDateKey)!;
      movEntry.events.push({
        id: movement.id,
        description: movement.description,
        amount: movement.amount,
        type: 'movement',
        category: movement.category,
        movementType: movement.type
      });

      // Adicionar datas de vencimento das parcelas
      if (movement.installments && movement.installments.length > 0) {
        movement.installments.forEach((installment) => {
          const parcelDate = new Date(installment.dueDate);
          const parcelDateKey = parcelDate.toISOString().split('T')[0];
          
          if (!dateMap.has(parcelDateKey)) {
            dateMap.set(parcelDateKey, {
              type: movement.type === 'entrada' ? 'receivable' : 'payable',
              events: []
            });
          }
          
          const parcelEntry = dateMap.get(parcelDateKey)!;
          parcelEntry.events.push({
            id: `${movement.id}-${installment.number}`,
            movementId: movement.id,
            description: `${movement.description} - Parcela ${installment.number}/${movement.installments?.length || 0}`,
            amount: installment.amount,
            type: 'parcel',
            status: installment.isPaid ? 'paid' : 'pending',
            movementType: movement.type,
            daysOverdue: installment.daysPastDue || 0
          });
        });
      }
    });

    return dateMap;
  }, [movements]);

  // Obter eventos para uma data específica
  const getEventsForDate = (date: Date | null) => {
    if (!date) return null;
    const dateKey = date.toISOString().split('T')[0];
    return importantDates.get(dateKey) || null;
  };

  // Contar eventos por tipo para uma data
  const getEventCounts = (date: Date) => {
    const events = getEventsForDate(date);
    if (!events) return { total: 0, receivable: 0, payable: 0 };
    
    const receivableCount = events.events.filter(e => e.movementType === 'entrada').length;
    const payableCount = events.events.length - receivableCount;
    
    return {
      total: events.events.length,
      receivable: receivableCount,
      payable: payableCount
    };
  };

  // Renderizar células do calendário com indicadores
  const tileContent = ({ date, view: viewType }: { date: Date; view: string }) => {
    if (viewType !== 'month') return null;

    const counts = getEventCounts(date);
    const dateKey = date.toISOString().split('T')[0];
    const hoveredKey = hoveredDate ? hoveredDate.toISOString().split('T')[0] : '';
    const isHovered = dateKey === hoveredKey;
    const dateEvents = getEventsForDate(date);

    return (
      <div className={styles.tileContentWrapper}>
        {counts.total > 0 && (
          <div className={styles.tileIndicators}>
            {counts.receivable > 0 && (
              <span className={`${styles.indicator} ${styles.receivable}`}>📥</span>
            )}
            {counts.payable > 0 && (
              <span className={`${styles.indicator} ${styles.payable}`}>📤</span>
            )}
          </div>
        )}
        
        {/* Tooltip inline sobre a data */}
        {isHovered && dateEvents && dateEvents.events.length > 0 && (
          <div className={styles.inlineTooltip}>
            <div className={styles.tooltipContent}>
              <div className={styles.tooltipHeader}>
                {date.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
              <div className={styles.tooltipEvents}>
                {dateEvents.events.slice(0, 5).map((event: any, idx: number) => {
                  const isReceivable = event.movementType === 'entrada';
                  const isOverdue = event.type === 'parcel' && event.daysOverdue > 0;
                  
                  return (
                    <div key={`${event.id}-${idx}`} className={styles.tooltipEventItem}>
                      <span className={styles.tooltipIcon}>
                        {isReceivable ? '📥' : '📤'}
                        {isOverdue && ' ⚠️'}
                      </span>
                      <span className={styles.tooltipText}>{event.description}</span>
                      <span className={`${styles.tooltipAmount} ${isReceivable ? styles.positive : styles.negative}`}>
                        {formatCurrency(event.amount)}
                      </span>
                    </div>
                  );
                })}
                {dateEvents.events.length > 5 && (
                  <div className={styles.tooltipMore}>
                    +{dateEvents.events.length - 5} mais...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar classes das tiles
  const tileClassName = ({ date, view: viewType }: { date: Date; view: string }) => {
    if (viewType !== 'month') return '';
    
    const dateKey = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const selectedKey = selectedDate ? (selectedDate as Date).toISOString().split('T')[0] : '';

    let classes = '';
    
    if (dateKey === selectedKey) {
      classes += ` selected`;
    }
    
    if (dateKey === today) {
      classes += ` today`;
    }

    if (importantDates.has(dateKey)) {
      classes += ` hasEvents`;
    }

    return classes;
  };

  // Handler de mouse move
  const handleTileMouseEnter = (date: Date) => {
    setHoveredDate(date);
  };

  const handleTileMouseLeave = () => {
    setHoveredDate(null);
  };

  return (
    <div className={styles.fullCalendarContainer}>
      <div className={styles.calendarFullWrapper}>
        <h1>📅 Agenda de Datas Importantes</h1>
        
        <div 
          className={styles.calendarWrapper}
          onMouseMove={(e) => {
            const target = e.target as HTMLElement;
            const tile = target.closest('button.react-calendar__tile');
            
            if (tile) {
              const abbr = tile.querySelector('abbr');
              if (abbr) {
                const ariaLabel = abbr.getAttribute('aria-label');
                if (ariaLabel) {
                  // Parse "20 de novembro de 2025"
                  const match = ariaLabel.match(/(\d{1,2}) de (\w+) de (\d{4})/);
                  if (match) {
                    const monthMap: { [key: string]: number } = {
                      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
                      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
                      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
                    };
                    const day = parseInt(match[1]);
                    const month = monthMap[match[2].toLowerCase()];
                    const year = parseInt(match[3]);
                    
                    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                      handleTileMouseEnter(new Date(year, month, day));
                    }
                  }
                }
              }
            } else {
              handleTileMouseLeave();
            }
          }}
          onMouseLeave={handleTileMouseLeave}
        >
          <ReactCalendar
            onChange={(date: any) => setSelectedDate(date)}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="pt-BR"
          />
        </div>

        <div className={styles.legendContainer}>
          <div className={styles.legendItem}>
            <span className={styles.legendIcon}>📥</span>
            <span>A Receber</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendIcon}>📤</span>
            <span>A Pagar</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendIcon}>⚠️</span>
            <span>Atrasado</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendColor} style={{background: '#fff3cd'}}></span>
            <span>Hoje</span>
          </div>
        </div>
      </div>
    </div>
  );
};
