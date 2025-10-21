
import React, { useEffect, useRef, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import Icon from './Icon.tsx';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children, title, className }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
       document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className={`bg-card border border-border rounded-lg shadow-lg w-full max-w-lg m-4 max-h-[90vh] flex flex-col relative animate-pop-in ${className}`}
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-semibold">{title || ''}</h3>
             <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
                <Icon name="x" className="w-5 h-5" />
                <span className="sr-only">Close</span>
            </button>
        </div>
        <div className="p-6 overflow-y-auto">
            {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
