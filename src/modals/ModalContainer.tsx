import { memo, useEffect, useRef } from 'react';
import { useModalStore } from '../store';
import SendModal from './Send';

const Modals: Record<string, React.MemoExoticComponent<(props: any) => React.JSX.Element>> = {
  send: SendModal,
};

const ModalContainer = () => {
  const modalRef = useRef<HTMLDialogElement>(null);

  const { isOpen, modalName, modalParams, closeModal } = useModalStore();
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  const Modal = modalName ? Modals[modalName] : null;

  return (
    <dialog ref={modalRef} className="modal bg-zinc-950 bg-opacity-50">
      <div className="modal-box overflow-visible px-0 py-4">
        <button
          className="btn btn-transparent opacity-60 hover:opacity-80 absolute right-2 top-2 p-2 text-lg z-10"
          onClick={closeModal}
        >
          ✕
        </button>

        {Modal && <Modal {...modalParams} />}
      </div>
    </dialog>
  );
};

export default memo(ModalContainer);
