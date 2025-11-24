import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
}

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning',
    onConfirm: () => {}
  });

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          ...options,
          onConfirm: () => {
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          }
        });

        // Se o usuário fechar sem confirmar, resolve como false
        const handleCancel = () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        };

        // Armazena handleCancel no estado para usar no component
        setConfirmState((prev) => ({ ...prev, onCancel: handleCancel }));
      });
    },
    []
  );

  const cancel = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    confirm,
    cancel,
    confirmState,
    isOpen: confirmState.isOpen
  };
};
