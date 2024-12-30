import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { styled } from "styled-components";
import { Input } from "antd";
import { TextAreaRef } from "antd/es/input/TextArea";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { SmartMerge, SmartOmit, StyledComponentProps } from "@/utils";
import { useStateWithCb } from "@/hooks/useStateWithCb";
const { TextArea: AntdTextArea } = Input;

const TextAreaBase = styled(AntdTextArea)`
  && {
    width: 100%;
    border: none;
    border-radius: 0;
    background: transparent;

    font-weight: bold;
    transition: none;

    &&::placeholder {
      color: #777;
    }

    &:focus,
    &:focus-within {
      outline: none;
    }

    &:not([readonly]) {
      outline: 2px solid yellow;
    }
  }
`;

export type OnEditStart = ({
  textAreaHandle,
}: {
  textAreaHandle: TextAreaHandle;
}) => void;

export type OnEditFinish = ({
  textAreaHandle,
  oldValue,
  newValue,
}: {
  textAreaHandle: TextAreaHandle;
  oldValue: string;
  newValue: string;
}) => void;

export type OnEditCancel = ({
  textAreaHandle,
}: {
  textAreaHandle: TextAreaHandle;
}) => void;

export type OnEditChange = ({
  textAreaHandle,
  event,
  oldValue,
  newValue,
}: {
  textAreaHandle: TextAreaHandle;
  event: React.ChangeEvent<HTMLTextAreaElement>;
  oldValue: string;
  newValue: string;
}) => void;

export type OnEditKeyDown = ({
  textAreaHandle,
  event,
}: {
  textAreaHandle: TextAreaHandle;
  event: React.KeyboardEvent<HTMLTextAreaElement>;
}) => void;

export type TextAreaPropsListeners = {
  onEditStart?: OnEditStart;
  onEditCancel?: OnEditCancel;
  onEditChange?: OnEditChange;
  onEditFinish?: OnEditFinish;
  onEditKeyDown?: OnEditKeyDown;
};

export type TextAreaExtendProps = SmartOmit<TextAreaProps, "value">;

export type TextAreaProps = SmartMerge<
  {
    value?: string;
    isEditMode?: boolean;
    alertMessageOnEditStart?: string | null;
  } & TextAreaPropsListeners
> &
  SmartOmit<StyledComponentProps<"textarea">, "children">;

export type TextAreaHandle = TextAreaRef & {
  value: string;
  isEditMode: boolean;
  alertMessageOnEditStart: string | null;
  dispatchEditCancel: () => void;
  dispatchEditEnable: () => void;
  dispatchEditFinish: () => void;
};

export const TextArea = withMemoAndRef<
  "textarea",
  TextAreaHandle,
  TextAreaProps
>({
  displayName: "TextArea",
  Component: (
    {
      value = "",
      isEditMode = false,
      alertMessageOnEditStart: _alertMessageOnEditStart,
      onEditStart,
      onEditCancel,
      onEditChange,
      onEditFinish,
      onEditKeyDown,
      ...otherProps
    },
    ref,
  ) => {
    const { state: stateIsEditMode, setState: setStateIsEditMode } =
      useStateWithCb<boolean>({
        initialState: isEditMode,
      });
    const [stateValue, setStateValue] = useState<string>(value);
    const refValueBackup = useRef<string>(value);

    const refBase = useRef<TextAreaHandle | null>(null);

    const editCancelHandler = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event: FocusEvent | React.KeyboardEvent<HTMLTextAreaElement>) => {
        // console.log("[editCancelHandler]");

        setStateIsEditMode({ newStateOrSetStateAction: false });
        setStateValue(refValueBackup.current);

        if (!refBase.current) {
          return;
        }
        onEditCancel?.({
          textAreaHandle: refBase.current,
        });
      },
      [setStateIsEditMode, onEditCancel],
    );

    const alertMessageOnEditStart =
      typeof _alertMessageOnEditStart === "undefined"
        ? "Press 'enter' to finish the edit.\nPress 'esc' or touch/click elsewhere to cancel."
        : _alertMessageOnEditStart;

    const editEnableHandler = useCallback<React.MouseEventHandler<TextAreaRef>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        setStateIsEditMode({
          newStateOrSetStateAction: true,
          cb: () => {
            if (!refBase.current) {
              return;
            }
            if (alertMessageOnEditStart !== null) {
              alert(alertMessageOnEditStart);

              refBase.current.focus({ cursor: "all" });

              // Delay execution to prevent interference. For example, `focus` event.
              // Introduce a small delay before execution using a setTimeout.
              // cf> https://stackoverflow.com/a/53702815/11941803
              setTimeout(() =>
                refBase.current?.resizableTextArea?.textArea.addEventListener(
                  "blur",
                  editCancelHandler,
                  {
                    once: true,
                  },
                ),
              );
            }

            onEditStart?.({
              textAreaHandle: refBase.current,
            });
          },
        });
      },
      [
        alertMessageOnEditStart,
        setStateIsEditMode,
        onEditStart,
        editCancelHandler,
      ],
    );

    const editFinishHandler = useCallback<
      React.KeyboardEventHandler<HTMLTextAreaElement>
    >(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        // console.log("[editFinishHandler]");

        setStateIsEditMode({ newStateOrSetStateAction: false });
        refValueBackup.current = stateValue;

        if (!refBase.current) {
          return;
        }
        onEditFinish?.({
          textAreaHandle: refBase.current,
          oldValue: value,
          newValue: stateValue,
        });
      },
      [value, stateValue, setStateIsEditMode, onEditFinish],
    );

    const editChangeHandler = useCallback<
      React.ChangeEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        setStateValue(event.target.value);

        if (!refBase.current) {
          return;
        }
        onEditChange?.({
          textAreaHandle: refBase.current,
          event,
          oldValue: value,
          newValue: event.target.value,
        });
      },
      [value, onEditChange],
    );

    const editKeyDownHandler = useCallback<
      React.KeyboardEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        if (!refBase.current) {
          return;
        }
        onEditKeyDown?.({
          textAreaHandle: refBase.current,
          event,
        });
      },
      [onEditKeyDown],
    );

    // https://stackoverflow.com/a/3169849/11941803
    const resetTextSelectionRange = useCallback(() => {
      console.log("[resetTextSelectionRange]");
      if (!window) {
        return;
      }
      const selection = window.getSelection();
      if (!selection) {
        return;
      }

      if ("empty" in (selection as any)) {
        // Chrome
        selection.empty();
        return;
      } else if ("removeAllRanges" in (selection as any)) {
        // Firefox, Safari, IE
        selection.removeAllRanges();
        return;
      }
      // if (!refBase.current?.resizableTextArea?.textArea) {
      //   return;
      // }
      // refBase.current.resizableTextArea.textArea.setSelectionRange(0, 0);
    }, []);

    useImperativeHandle(ref, () => {
      refBase.current = {
        ...refBase.current, // <- Mandatory. Should not omit. It stores `TextAreaRef` values from antd.)
        value: stateValue,
        isEditMode: stateIsEditMode,
        alertMessageOnEditStart,
        dispatchEditCancel: editCancelHandler,
        dispatchEditEnable: editEnableHandler,
        dispatchEditFinish: editFinishHandler,
      } as TextAreaHandle;
      return refBase.current;
    });

    return (
      <TextAreaBase
        ref={refBase}
        value={stateValue}
        // autoFocus
        autoSize
        readOnly={!stateIsEditMode}
        onClick={editEnableHandler}
        onKeyDown={editKeyDownHandler}
        onChange={editChangeHandler}
        onBlur={resetTextSelectionRange}
        {...otherProps}
      />
    );
  },
});

export type UseTextAreaParams = SmartMerge<
  {
    initialIsEditMode?: boolean;
    onEditModeChange?: (params?: {
      isEditModeOld: boolean;
      isEditModeNew: boolean;
    }) => void;
  } & TextAreaPropsListeners
>;

export const useTextArea = (params?: UseTextAreaParams) => {
  const {
    initialIsEditMode = false,
    onEditModeChange,
    onEditStart: _onEditStart,
    onEditCancel: _onEditCancel,
    onEditChange: _onEditChange,
    onEditFinish: _onEditFinish,
  } = params ?? {};

  const [stateIsEditMode, setStateIsEditMode] =
    useState<boolean>(initialIsEditMode);

  const enableEditMode = useCallback(() => {
    setStateIsEditMode(true);
    onEditModeChange?.({
      isEditModeOld: stateIsEditMode,
      isEditModeNew: true,
    });
  }, [onEditModeChange, stateIsEditMode]);

  const disableEditMode = useCallback(() => {
    setStateIsEditMode(false);
    onEditModeChange?.({
      isEditModeOld: stateIsEditMode,
      isEditModeNew: false,
    });
  }, [onEditModeChange, stateIsEditMode]);

  const toggleEditMode = useCallback(() => {
    setStateIsEditMode((curIsEditMode) => !curIsEditMode);
    onEditModeChange?.({
      isEditModeOld: stateIsEditMode,
      isEditModeNew: !stateIsEditMode,
    });
  }, [onEditModeChange, stateIsEditMode]);

  const onEditStart = useCallback<OnEditStart>(
    ({ textAreaHandle }) => {
      enableEditMode();
      _onEditStart?.({ textAreaHandle });
    },
    [_onEditStart, enableEditMode],
  );

  const onEditCancel = useCallback<OnEditCancel>(
    ({ textAreaHandle }) => {
      _onEditCancel?.({ textAreaHandle });
      disableEditMode();
    },
    [_onEditCancel, disableEditMode],
  );

  const onEditChange = useCallback<OnEditChange>(
    ({ textAreaHandle, event, oldValue, newValue }) => {
      _onEditChange?.({
        textAreaHandle,
        event,
        oldValue,
        newValue,
      });
    },
    [_onEditChange],
  );

  const onEditFinish = useCallback<OnEditFinish>(
    ({ textAreaHandle, oldValue, newValue }) => {
      _onEditFinish?.({ textAreaHandle, oldValue, newValue });
      disableEditMode();
    },
    [_onEditFinish, disableEditMode],
  );

  return {
    isEditMode: stateIsEditMode,
    enableEditMode,
    disableEditMode,
    toggleEditMode,
    onEditStart,
    onEditCancel,
    onEditChange,
    onEditFinish,
  };
};
