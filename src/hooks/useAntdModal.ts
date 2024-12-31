import { useCallback } from "react";

export const useAntdModal = () => {
  // Fixes antd bug
  // Bug: After we close the modal, `tabindex` stays at `-1`
  const setModalOpen = useCallback(
    ({
      refAnyInnerElement,
      cb,
    }: {
      refAnyInnerElement: HTMLElement;
      cb?: () => void;
    }) => {
      setTimeout(() => {
        if (!refAnyInnerElement) {
          return;
        }

        const modals = document.querySelectorAll(".ant-modal-wrap");
        for (const modal of modals) {
          if (modal.contains(refAnyInnerElement)) {
            modal.setAttribute("tabindex", "0");
            break;
          }
        }
        // console.log(modals);

        cb?.();

        // textarea.focus();
        // console.log(document.activeElement);

        // if ("setSelectionRange" in textarea) {
        //   textarea.setSelectionRange(0, 0);
        // }

        // const selection = window.getSelection();
        // const range = document.createRange();
        // range.selectNodeContents(textarea);
        // range.collapse(true); // Move caret to the start
        // selection?.removeAllRanges();
        // selection?.addRange(range);
      }, 1);
    },
    [],
  );

  const setModalClose = useCallback(
    ({ refAnyInnerElement }: { refAnyInnerElement: HTMLElement }) => {
      const modals = document.querySelectorAll(".ant-modal-wrap");
      for (const modal of modals) {
        if (modal.contains(refAnyInnerElement)) {
          modal.setAttribute("tabindex", "-1");
          break;
        }
      }
    },
    [],
  );

  return {
    setModalOpen,
    setModalClose,
  };
};
