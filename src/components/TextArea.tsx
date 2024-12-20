import { styled } from "styled-components";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { Input } from "antd";
import { SmartOmit, StyledComponentProps } from "@/utils";
import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { TextAreaRef } from "antd/es/input/TextArea";
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
    &:focus,
    &:focus-within {
      box-shadow: none;
    }

    &:not([readonly]) {
      outline: 2px solid yellow;
    }
  }
`;

export type OnEditStart = ({
  elementTextArea,
  handlers,
}: {
  elementTextArea: TextAreaRef;
  handlers: {
    editCancelHandler: () => void;
  };
}) => void;
// export type OnEditStartItem = OnEditStart;

export type OnEditCancel = () => void;
// export type OnEditCancelItem = OnEditCancel;

export type OnEditChange = ({
  event,
  oldValue,
  newValue,
}: {
  event: React.ChangeEvent<HTMLTextAreaElement>;
  oldValue: string;
  newValue: string;
}) => void;
// export type OnEditingItem<I> = ({
//   event,
//   oldValue,
//   newValue,
// }: {
//   event: React.ChangeEvent<HTMLTextAreaElement>;
//   oldValue: I;
//   newValue: I;
// }) => void;

export type OnEditFinish = ({
  oldValue,
  newValue,
}: {
  oldValue: string;
  newValue: string;
}) => void;
// export type OnEditFinishItem<I> = ({
//   oldValue,
//   newValue,
// }: {
//   oldValue: I;
//   newValue: I;
// }) => void;

export type TextAreaProps = {
  value?: string;
  initialEditMode?: boolean;
  shouldUseAlertOnEditStart?: boolean;
  onEditStart?: OnEditStart;
  onEditCancel?: OnEditCancel;
  onEditChange?: OnEditChange;
  onEditFinish?: OnEditFinish;
} & SmartOmit<StyledComponentProps<"textarea">, "children">;

export type TextAreaHandle = TextAreaRef & {
  isEditMode: boolean;
  dispatchEditCancel: () => void;
  dispatchEditEnable: () => void;
  dispatchEditFinish: () => void;
  dispatchEditChange: () => void;
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
      initialEditMode,
      shouldUseAlertOnEditStart = true,
      onEditStart,
      onEditCancel,
      onEditChange,
      onEditFinish,
      ...otherProps
    },
    ref,
  ) => {
    const { state: stateIsEditMode, setState: setStateIsEditMode } =
      useStateWithCb<boolean>({
        initialState: initialEditMode ?? false,
      });
    const [stateValue, setStateValue] = useState<string>(value);
    const refValueBackup = useRef<string>(value);

    const refBase = useRef<TextAreaRef | null>(null);

    const editCancelHandler = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event: FocusEvent) => {
        setStateIsEditMode({ newStateOrSetStateAction: false });
        setStateValue(refValueBackup.current);

        onEditCancel?.();
      },
      [setStateIsEditMode, onEditCancel],
    );

    const editEnableHandler = useCallback<React.MouseEventHandler<TextAreaRef>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        setStateIsEditMode({
          newStateOrSetStateAction: true,
          cb: () => {
            if (!refBase.current) {
              return;
            }
            if (shouldUseAlertOnEditStart) {
              alert("Press enter when the edit is finished.");

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
              elementTextArea: refBase.current,
              handlers: {
                editCancelHandler: editCancelHandler as () => void,
              },
            });
          },
        });
      },
      [
        shouldUseAlertOnEditStart,
        setStateIsEditMode,
        onEditStart,
        editCancelHandler,
      ],
    );

    const editFinishHandler = useCallback<
      React.KeyboardEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        if (event.key !== "Enter") {
          return;
        }
        setStateIsEditMode({ newStateOrSetStateAction: false });
        refValueBackup.current = stateValue;

        onEditFinish?.({
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

        onEditChange?.({
          event,
          oldValue: value,
          newValue: event.target.value,
        });
      },
      [value, onEditChange],
    );

    useImperativeHandle(ref, () => {
      return {
        ...(refBase.current as TextAreaRef),
        isEditMode: stateIsEditMode,
        dispatchEditCancel: editCancelHandler,
        dispatchEditEnable: editEnableHandler,
        dispatchEditFinish: editFinishHandler,
        dispatchEditChange: editChangeHandler,
      } as TextAreaHandle;
    });

    return (
      <TextAreaBase
        ref={refBase}
        value={stateValue}
        // autoFocus
        autoSize
        readOnly={!stateIsEditMode}
        onClick={editEnableHandler}
        onKeyDown={editFinishHandler}
        onChange={editChangeHandler}
        {...otherProps}
      />
    );
  },
});

export type UseTextAreaParam = {
  onEditStartItem?: OnEditStart;
  onEditCancelItem?: OnEditCancel;
  onEditChangeItem?: OnEditChange;
  onEditFinishItem?: OnEditFinish;
};

export const useTextArea = (param?: UseTextAreaParam) => {
  const {
    onEditStartItem,
    onEditCancelItem,
    onEditChangeItem,
    onEditFinishItem,
  } = param ?? {};

  const [stateIsEditMode, setStateIsEditMode] = useState<boolean>(false);

  const onEditModeEnabled = useCallback(() => {
    setStateIsEditMode(true);
  }, []);

  const onEditModeDisabled = useCallback(() => {
    setStateIsEditMode(false);
  }, []);

  const onEditStart = useCallback<OnEditStart>(
    ({ elementTextArea, handlers }) => {
      onEditModeEnabled();
      onEditStartItem?.({ elementTextArea, handlers });
    },
    [onEditStartItem, onEditModeEnabled],
  );

  const onEditCancel = useCallback<OnEditCancel>(() => {
    onEditCancelItem?.();
    onEditModeDisabled();
  }, [onEditCancelItem, onEditModeDisabled]);

  const onEditChange = useCallback<OnEditChange>(
    ({ event, oldValue, newValue }) => {
      onEditChangeItem?.({
        event,
        oldValue,
        newValue,
      });
    },
    [onEditChangeItem],
  );

  const onEditFinish = useCallback<OnEditFinish>(
    ({ oldValue, newValue }) => {
      onEditFinishItem?.({ oldValue, newValue });
      onEditModeDisabled();
    },
    [onEditFinishItem, onEditModeDisabled],
  );

  return {
    stateIsEditMode,
    setStateIsEditMode,
    onEditModeEnabled,
    onEditModeDisabled,
    onEditStart,
    onEditCancel,
    onEditChange,
    onEditFinish,
  };
};
