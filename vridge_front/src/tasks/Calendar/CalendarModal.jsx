import React, { useState } from 'react'
import { Modal, ModalProps } from 'antd'

export default function CalendarModal({ ModalTitle, ModalText, visible }) {
  return (
    <Modal
      //   wrapClassName="mo"
      footer={false}
      centered
      //   width={width}
      //   style={style}
      open={visible ? visible : false}
      //   onCancel={() => {
      //     dispatch(
      //       updateCommonStore({
      //         commonModalVisible: false,
      //       }),
      //     )
      //     if (onCancel) onCancel()
      //   }}
      closable={false}
      // maskClosable={true}
    >
      {ModalTitle}
      {ModalText}
    </Modal>
  )
}

React.memo(CalendarModal)
