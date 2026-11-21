import { useId, useRef } from 'react';

export function LeaveRoomButton({ onLeave, activeMatch = false }: { onLeave: () => void; activeMatch?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const description = useId();

  return (
    <>
      <button type="button" className="ui-button ui-button-exit" onClick={() => dialog.current?.showModal()}>
        Leave room
      </button>
      <dialog ref={dialog} className="confirm-dialog" aria-labelledby={heading} aria-describedby={description}>
        <h2 id={heading} className="text-xl font-semibold">Leave this room?</h2>
        <p id={description} className="mt-2 text-sm text-muted">
          {activeMatch ? 'Leaving forfeits your seat in this match.' : 'You’ll leave your seat and return to the start screen.'}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" autoFocus className="ui-button" onClick={() => dialog.current?.close()}>Stay</button>
          <button type="button" className="ui-button ui-button-danger" onClick={() => {
            dialog.current?.close();
            onLeave();
          }}>Confirm leave</button>
        </div>
      </dialog>
    </>
  );
}
