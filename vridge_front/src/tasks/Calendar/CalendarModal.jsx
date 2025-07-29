import React, { useState } from 'react';
;
import UnifiedModal from "../../components/unified/UnifiedModal";
export default function CalendarModal({
  ModalTitle,
  ModalText,
  visible,
  onClose
}) {
  return (
    <UnifiedModal
      open={visible || false}
      onClose={onClose || (() => {})}
      title={ModalTitle}
      closeOnBackdrop={false}
      closeOnEsc={false}
    >
      {ModalText}
    </UnifiedModal>
  );
}
React.memo(CalendarModal);