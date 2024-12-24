import { createContext, useMemo } from "react";
import {
  atomFamily,
  RecoilRoot,
  useRecoilCallback,
  useRecoilState,
} from "recoil";
import { recoilPersist } from "recoil-persist";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { NestedIndexer, NestedIndexerBaseItem } from "@/indexer";
import { createKeyValueMapping, SmartMerge } from "@/utils";

// function sortCollisions({ order }: { order: "ascending" | "descending" }) {
//   return (
//     { data: { value: a } }: CollisionDescriptor,
//     { data: { value: b } }: CollisionDescriptor,
//   ) => {
//     return order === "ascending"
//       ? a - b
//       : order === "descending"
//         ? b - a
//         : a - b;
//   };
// }

// // import { getIntersectionRatio } from "@dnd-kit/core/dist/utilities/algorithms/rectIntersection";
// // ㄴ File not exists error
// // https://github.com/clauderic/dnd-kit/issues/1198#issuecomment-1734036277
// function getIntersectionRatio(rect1: ClientRect, rect2: ClientRect): number {
//   const xOverlap = Math.max(
//     0,
//     Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
//   );
//   const yOverlap = Math.max(
//     0,
//     Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top),
//   );

//   const intersectionArea = xOverlap * yOverlap;
//   const rect1Area = rect1.width * rect1.height;

//   return rect1Area > 0 ? intersectionArea / rect1Area : 0;
// }

// let lastCollisionId: UniqueIdentifier | null = null;

// export const customCollisionDetectionAlgorithm: CollisionDetection = (args) => {
//   const {
//     droppableContainers,
//     droppableRects,
//     collisionRect,
//     active,
//     pointerCoordinates,
//   } = args;
//   // console.log(droppableContainers);
//   // console.log(args);

//   const droppables: DroppableContainer[] = [];
//   // const collisions: Collision | CollisionDescriptor[] = [];
//   for (const droppable of droppableContainers) {
//     const { id: droppableId } = droppable;
//     const rect = droppableRects.get(droppableId);
//     if (!rect) {
//       continue;
//     }
//     const intersectionRatio = getIntersectionRatio(rect, collisionRect);
//     if (intersectionRatio > 0) {
//       // collisions.push({
//       //   id: droppableId,
//       //   data: {
//       //     droppableContainer: droppable,
//       //     value: intersectionRatio,
//       //   },
//       // } satisfies CollisionDescriptor);
//       droppables.push(droppable);
//     }
//   }

//   const closestCornersCollisions = !droppables.length
//     ? (closestCorners(args) as CollisionDescriptor[])
//     : (closestCorners({
//         collisionRect,
//         droppableRects,
//         droppableContainers: droppables,
//         active,
//         pointerCoordinates,
//       }) as CollisionDescriptor[]);

//   closestCornersCollisions.sort(sortCollisions({ order: "ascending" }));

//   // console.log(droppables.map((droppable) => droppable.id));
//   console.log(closestCornersCollisions.map((collision) => collision.id));
//   console.log(closestCornersCollisions[0].data.value);
//   console.log(closestCornersCollisions[1].data.value);
//   console.log(lastCollisionId);
//   console.log(active.id);

//   // if (
//   //   closestCornersCollisions.length > 0 &&
//   //   closestCornersCollisions[0].id === lastCollisionId
//   // ) {
//   //   closestCornersCollisions.shift();
//   //   return [];
//   // }

//   if (closestCornersCollisions.length > 0) {
//     lastCollisionId = closestCornersCollisions[0].id;
//   }

//   // console.log(closestCornersCollisions);
//   return closestCornersCollisions;
// };

///////////////////////////////////////////
// `droppableContainers[0]`
// data:
//   current:
//     customData: {boardListId: 'category-task-board', type: 'child', item: {…}}
//     sortable: {containerId: 'ba605f3e-b99e-4450-aa0a-ddd0ec22ad71', index: 0, items: Array(6)}
//   disabled: false
//   id: "ffbde292-895d-47c8-bd6d-da6fe93dc946"
//   key: "Droppable-1"
//   node: {current: div.sc-eUlrpB.NWbTN}
//   rect:
//     current: Rect
//       bottom: (...)
//       height: 91
//       left: (...)
//       right: (...)
//       top: (...)
//       width: 248
// active: {id: 'ffbde292-895d-47c8-bd6d-da6fe93dc946', data: {…}, rect: {…}}
// collisionRect:
//   bottom: 316.796875
//   height: 91
//   left: 41
//   right: 289
//   top: 225.796875
//   width: 248
// droppableRects: Map(13) {'ffbde292-895d-47c8-bd6d-da6fe93dc946' => Rect, '7c1ff38e-d7de-4093-bcda-16fcfd1644d0' => Rect, '1288c3bd-5a96-46cd-8eb8-28d191f11da9' => Rect, '16def70c-2057-4ad5-9261-cb833728f30a' => Rect, '0cd50106-6130-4da0-b0a0-39e0496da2ca' => Rect, …}
// pointerCoordinates: {x: 58, y: 295}
// export const customCollisionDetectionAlgorithm2: CollisionDetection = ({
//   droppableContainers,
//   ...args
// }) => {
//   // console.log(droppableContainers);
//   console.log(args);

//   // First, let's see if the `trash` droppable rect is intersecting
//   const rectIntersectionCollisions = rectIntersection({
//     ...args,
//     droppableContainers: droppableContainers.filter(({ id }) => id === "trash"),
//   });

//   // Collision detection algorithms return an array of collisions
//   if (rectIntersectionCollisions.length > 0) {
//     // The trash is intersecting, return early
//     return rectIntersectionCollisions;
//   }

//   // Compute other collisions
//   return closestCorners({
//     ...args,
//     droppableContainers: droppableContainers.filter(({ id }) => id !== "trash"),
//   });
// };

///////////////////////////////////////////

type CustomDroppableContainer = {
  id: string;
};

type CustomCircleCollision = {
  id: string;
  data: {
    droppableContainer: CustomDroppableContainer;
    value: number;
  };
};

type CustomDroppableRects = Map<string, DOMRect>;

type CircleIntersectionArgs = {
  collisionRect: HTMLElement;
  droppableRects: CustomDroppableRects;
  droppableContainers: CustomDroppableContainer[];
};

// Sort collisions in descending order (from greatest to smallest value)
function sortCollisionsDescCustom(
  { data: { value: a } }: CustomCircleCollision,
  { data: { value: b } }: CustomCircleCollision,
) {
  return b - a;
}

function getCircleIntersection(
  entry: DOMRect | HTMLElement,
  target: DOMRect | HTMLElement,
): number {
  // Abstracted the logic to calculate the radius for simplicity
  const circle1 = {
    radius: 20,
    x: entry instanceof HTMLElement ? entry.offsetLeft : entry.left,
    y: entry instanceof HTMLElement ? entry.offsetTop : entry.top,
  };
  const circle2 = {
    radius: 12,
    x: target instanceof HTMLElement ? target.offsetLeft : target.left,
    y: target instanceof HTMLElement ? target.offsetTop : target.top,
  };

  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < circle1.radius + circle2.radius) {
    return distance;
  }

  return 0;
}

// Returns the circle that has the greatest intersection area
const circleIntersection = ({
  collisionRect,
  droppableRects,
  droppableContainers,
}: CircleIntersectionArgs): CustomCircleCollision[] => {
  const collisions: CustomCircleCollision[] = [];

  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);

    if (rect) {
      const intersectionRatio = getCircleIntersection(rect, collisionRect);

      if (intersectionRatio > 0) {
        collisions.push({
          id,
          data: { droppableContainer, value: intersectionRatio },
        });
      }
    }
  }

  return collisions.sort(sortCollisionsDescCustom);
};

///////////////////////////////////////////

// https://github.com/clauderic/dnd-kit/issues/900#issuecomment-1879870810
// export const customCollisionDetectionAlgorithm: CollisionDetection = (args) => {
//   const closestCornersCollisions = closestCorners(args);
//   const closestCenterCollisions = closestCenter(args);
//   const pointerWithinCollisions = pointerWithin(args);

//   if (
//     closestCornersCollisions.length > 0 &&
//     closestCenterCollisions.length > 0 &&
//     pointerWithinCollisions.length > 0
//   ) {
//     return pointerWithinCollisions;
//   }

//   return [];
// };

///////////////////////////////////////////

// https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#composition-of-existing-algorithms
// export const customCollisionDetectionAlgorithm: CollisionDetection = (args) => {
//   // // First, let's see if there are any collisions with the pointer
//   // const pointerCollisions = pointerWithin(args);
//   // // Collision detection algorithms return an array of collisions
//   // if (pointerCollisions.length > 0) {
//   //   return pointerCollisions;
//   // }
//   // If there are no collisions with the pointer, return rectangle intersections
//   return rectIntersection(args);
// };

///////////////////////////////////////////

export function getDroppable({
  boardListId,
  droppableId,
}: {
  boardListId: string;
  droppableId: string;
}) {
  const droppable = document.querySelector(
    `[${DroppableCustomAttributesKvMapping["data-board-list-id"]}=${boardListId}][${DroppableCustomAttributesKvMapping["data-droppable-id"]}="${droppableId}"]`,
  ) as HTMLElement | null;
  return { droppable };
}

export function getDraggable({
  boardListId,
  draggableId,
}: {
  boardListId: string;
  draggableId: string;
}) {
  const draggable = document.querySelector(
    `[${DraggableCustomAttributesKvMapping["data-board-list-id"]}=${boardListId}][${DraggableCustomAttributesKvMapping["data-draggable-id"]}="${draggableId}"]`,
  ) as HTMLElement | null;
  return { draggable };
}

export function getDndContextInfoFromData({
  boardListContext,
  data,
}: {
  boardListContext: BoardListContext;
  data: DndDataInterfaceCustom;
}): {
  draggableId: string | null;
  droppableId: string | null;
  indexOfDraggable: number;
  parentAsDroppableOfChild: {
    droppableId: string | null;
    droppableLength: number;
  } | null;
} {
  const boardListId = data.customData.boardListId;
  const draggableId = data.customData.item.id;
  if (boardListId !== boardListContext.boardListId) {
    return {
      draggableId: null,
      droppableId: null,
      indexOfDraggable: -1,
      parentAsDroppableOfChild: null,
    };
  }

  if (isParentItemData(data)) {
    // const parentIdList = boardListContext.indexer.getParentIdList() ?? null;
    // const indexOfDraggable = !parentIdList
    //   ? -1
    //   : parentIdList?.findIndex((parentId) => parentId === draggableId);
    // const childIdList =
    //   boardListContext.indexer.getChildIdListOfParentId({
    //     parentId: draggableId,
    //   }) ?? null;
    // return {
    //   draggableId,
    //   droppableId: boardListId,
    //   indexOfDraggable,
    //   parentAsDroppableOfChild: {
    //     droppableId: draggableId,
    //     droppableLength: !childIdList ? -1 : childIdList.length,
    //   },
    // };

    const _data = data as DndDataInterfaceActive | DndDataInterfaceOver;
    const indexOfDraggable = _data.sortable.index;
    return {
      draggableId,
      droppableId: boardListId,
      indexOfDraggable,
      parentAsDroppableOfChild: {
        droppableId: draggableId,
        droppableLength: _data.sortable.items.length,
      },
    };
  } else if (isChildItemData(data)) {
    // const childIdList = !droppableId
    //   ? null
    //   : boardListContext.indexer.getChildIdListOfParentId({
    //       parentId: droppableId,
    //     });
    // const indexOfDraggable = !childIdList
    //   ? -1
    //   : childIdList.findIndex((childId) => childId === draggableId);
    // return {
    //   draggableId,
    //   droppableId,
    //   indexOfDraggable,
    //   parentAsDroppableOfChild: null,
    // };

    const _data = data as DndDataInterfaceActive | DndDataInterfaceOver;
    const droppableId = _data.sortable.containerId;
    const indexOfDraggable = _data.sortable.index;
    return {
      draggableId,
      droppableId,
      indexOfDraggable,
      parentAsDroppableOfChild: null,
    };
  } else {
    return {
      draggableId: null,
      droppableId: null,
      indexOfDraggable: -1,
      parentAsDroppableOfChild: null,
    };
  }
}

export function getDndContextInfoFromActivator({
  boardListId,
  activator,
}: {
  boardListId: string;
  activator: HTMLElement;
}): {
  draggableHandleElement: HTMLElement | null;
  draggableHandleId: string | null;
  draggableElement: HTMLElement | null;
  draggableId: string | null;
} {
  if (!activator) {
    return {
      draggableHandleElement: null,
      draggableHandleId: null,
      draggableElement: null,
      draggableId: null,
    };
  }

  const draggableHandle = activator.closest(
    `[${DraggableHandleCustomAttributesKvMapping["data-board-list-id"]}=${boardListId}][${DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"]}]`,
  ) as HTMLElement | null;
  // ㄴ Assumes that draggable handle is always self/closest ancestor of the activator.
  // console.log(draggableHandle);
  if (!draggableHandle) {
    return {
      draggableHandleElement: null,
      draggableHandleId: null,
      draggableElement: null,
      draggableId: null,
    };
  }

  const draggableHandleId = draggableHandle.getAttribute(
    DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"],
  );
  // console.log(draggableHandleId);
  if (!draggableHandleId) {
    return {
      draggableHandleElement: draggableHandle,
      draggableHandleId: null,
      draggableElement: null,
      draggableId: null,
    };
  }

  const draggableId = draggableHandleId;

  const draggable = draggableHandle.closest(
    `[${DraggableCustomAttributesKvMapping["data-board-list-id"]}=${boardListId}][${DraggableCustomAttributesKvMapping["data-draggable-id"]}="${draggableId}"]`,
  ) as HTMLElement | null;
  // ㄴ Assumes that draggable is always self/closest ancestor of the handle.
  // console.log(draggable);
  if (!draggable) {
    return {
      draggableHandleElement: draggableHandle,
      draggableHandleId: draggableHandleId,
      draggableElement: null,
      draggableId: draggableId,
    };
  }
  return {
    draggableHandleElement: draggableHandle,
    draggableHandleId: draggableHandleId,
    draggableElement: draggable,
    draggableId: draggableId,
  };
}

///////////////////////////////////////

export type BoardContextValue = {
  setActivatorNodeRef: ((el: HTMLElement | null) => void) | undefined;
  // draggableHandleAttributes: DraggableAttributes | undefined;
  // draggableHandleListeners: SyntheticListenerMap | undefined;
};

export const BoardContext = createContext<BoardContextValue>({
  setActivatorNodeRef: undefined,
  // draggableHandleAttributes: undefined,
  // draggableHandleListeners: undefined,
});

export const BoardContextProvider = ({
  value,
  children,
}: {
  value: BoardContextValue;
  children: React.ReactNode;
}) => {
  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
};

///////////////////////////////////////

export type CardContextValue = {
  setActivatorNodeRef: ((el: HTMLElement | null) => void) | undefined;
  // draggableHandleAttributes: DraggableAttributes | undefined;
  // draggableHandleListeners: SyntheticListenerMap | undefined;
};

export const CardContext = createContext<CardContextValue>({
  setActivatorNodeRef: undefined,
  // draggableHandleAttributes: undefined,
  // draggableHandleListeners: undefined,
});

export const CardContextProvider = ({
  value,
  children,
}: {
  value: CardContextValue;
  children: React.ReactNode;
}) => {
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
};

///////////////////////////////////////

export type DndDataInterfaceCustom = {
  customData: {
    boardListId: string;
    type: string;
    item: NestedIndexerBaseItem;
  };
};

export function isCustomItemData(
  value: unknown,
): value is DndDataInterfaceCustom {
  return Boolean(value && typeof value === "object" && "customData" in value);
}

export function isParentItemData(
  value: unknown,
): value is DndDataInterfaceCustomGeneric<"parent"> {
  return isCustomItemData(value) && value.customData.type === "parent";
}

export function isChildItemData(
  value: unknown,
): value is DndDataInterfaceCustomGeneric<"child"> {
  return isCustomItemData(value) && value.customData.type === "child";
}

export const DndDataItemTypes = ["parent", "child"] as const;
export type DndDataItemType = (typeof DndDataItemTypes)[number];
export const DndDataItemTypeKvMapping = createKeyValueMapping({
  arr: DndDataItemTypes,
});

export type DndDataInterfaceCustomGeneric<
  T extends DndDataItemType = DndDataItemType,
> = {
  customData: {
    boardListId: string;
    type: string;
    item: T extends "parent"
      ? ParentItem
      : T extends "child"
        ? ChildItem
        : null;
  };
};

export type DndDataInterfaceActive<
  T extends DndDataItemType = DndDataItemType,
> = SmartMerge<
  DndDataInterfaceCustomGeneric<T> & {
    sortable: {
      containerId: string;
      index: number;
      items: string[];
    };
  }
>;
export type DndDataInterfaceOver<T extends DndDataItemType = DndDataItemType> =
  DndDataInterfaceActive<T>;

///////////////////////////////////////

export const DragOverlayCustomAttributes = [
  "data-board-list-id",
  "data-drag-overlay",
] as const;
export type DragOverlayCustomAttributeType =
  (typeof DragOverlayCustomAttributes)[number];
export const DragOverlayCustomAttributesKvMapping = createKeyValueMapping({
  arr: DragOverlayCustomAttributes,
});
export type DragOverlayCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DragOverlayCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DragOverlayCustomAttributesKvMapping)["data-drag-overlay"]]: "true";
  }
>;

export const ScrollContainerCustomAttributes = [
  "data-board-list-id",
  "data-scroll-container-id",
  "data-scroll-container-allowed-types",
] as const;
export type ScrollContainerCustomAttributeType =
  (typeof ScrollContainerCustomAttributes)[number];
export const ScrollContainerCustomAttributesKvMapping = createKeyValueMapping({
  arr: ScrollContainerCustomAttributes,
});
export type ScrollContainerCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof ScrollContainerCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof ScrollContainerCustomAttributesKvMapping)["data-scroll-container-id"]]: string;
  } & {
    [P in (typeof ScrollContainerCustomAttributesKvMapping)["data-scroll-container-allowed-types"]]: string;
  }
>;

export const DroppableCustomAttributes = [
  "data-board-list-id",
  "data-droppable-id",
  "data-droppable-allowed-types",
] as const;
export type DroppableCustomAttributeType =
  (typeof DroppableCustomAttributes)[number];
export const DroppableCustomAttributesKvMapping = createKeyValueMapping({
  arr: DroppableCustomAttributes,
});
export type DroppableCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DroppableCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DroppableCustomAttributesKvMapping)["data-droppable-id"]]: string;
  } & {
    [P in (typeof DroppableCustomAttributesKvMapping)["data-droppable-allowed-types"]]: string;
  }
>;

export function serializeAllowedTypes({
  allowedTypes,
}: {
  allowedTypes: DndDataItemType[];
}) {
  return JSON.stringify(allowedTypes).replaceAll(/\"/g, "'");
}

export function deserializeAllowedTypes({
  serializedAllowedTypes,
}: {
  serializedAllowedTypes: string;
}) {
  return JSON.parse(
    serializedAllowedTypes.replaceAll(/'/g, '"'),
  ) as DndDataItemType[];
}

export const DraggableCustomAttributes = [
  "data-board-list-id",
  "data-draggable-id",
] as const;
export type DraggableCustomAttributeType =
  (typeof DraggableCustomAttributes)[number];
export const DraggableCustomAttributesKvMapping = createKeyValueMapping({
  arr: DraggableCustomAttributes,
});
export type DraggableCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DraggableCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DraggableCustomAttributesKvMapping)["data-draggable-id"]]: string;
  }
>;

export const DraggableHandleCustomAttributes = [
  "data-board-list-id",
  "data-draggable-handle-id",
] as const;
export type DraggableHandleCustomAttributeType =
  (typeof DraggableHandleCustomAttributes)[number];
export const DraggableHandleCustomAttributesKvMapping = createKeyValueMapping({
  arr: DraggableHandleCustomAttributes,
});
export type DraggableHandleCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DraggableHandleCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DraggableHandleCustomAttributesKvMapping)["data-draggable-handle-id"]]: string;
  }
>;

///////////////////////////////////////

const { persistAtom } = recoilPersist({
  key: "recoilPersist", // this key is using to store data in local storage
  storage: localStorage, // configure which storage will be used to store the data
  converter: JSON, // configure how values will be serialized/deserialized in storage
});

const recoilKeys = createKeyValueMapping({
  arr: ["boardListContextAtomFamily"],
});

export type ParentItem = SmartMerge<
  NestedIndexerBaseItem & {
    title: string;
    items?: ChildItem[];
  }
> &
  Record<any, any>;

export type ChildItem = SmartMerge<
  NestedIndexerBaseItem & {
    content: string;
  }
> &
  Record<any, any>;

export class BoardListContextIndexer extends NestedIndexer<
  ParentItem,
  ChildItem
> {}

export type BoardListContextParams = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
};

export type BoardListContext = {
  boardListId: string;
  indexer: BoardListContextIndexer;
};

export type BoardListContextValue = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
  defaultItems?: ParentItem[];
};

export type UseBoardContextParams = BoardListContextParams;

export const boardListContextAtomFamily = atomFamily<
  BoardListContext,
  BoardListContextParams
>({
  key: recoilKeys["boardListContextAtomFamily"],
  default: ({ boardListId, parentKeyName, childKeyName }) => {
    return {
      boardListId,
      indexer: new BoardListContextIndexer({
        parentKeyName,
        childKeyName,
      }),
    };
  },
  // dangerouslyAllowMutability: true,
  effects_UNSTABLE: [persistAtom],
  effects: [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ setSelf, onSet }) => {
      // const localStorageKey = recoilKeys["nestedIndexerAtom"];

      // // Load initial value from localStorage (if available)
      // const storedValue = localStorage.getItem(localStorageKey);
      // if (storedValue) {
      //   try {
      //     const parsedValue = JSON.parse(storedValue);
      //     setSelf(new NestedIndexer(parsedValue));
      //   } catch (error) {
      //     console.error("Error parsing localStorage value:", error);
      //   }
      // }

      // Save value to localStorage whenever it changes
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onSet((newValue) => {
        // console.log(JSON.stringify(newValue.toPlain()));
        // console.log(JSON.stringify(newValue.toString()));
        // try {
        //   localStorage.setItem(localStorageKey, JSON.stringify(newValue));
        // } catch (error) {
        //   console.error("Error saving to localStorage:", error);
        // }
      });
    },
  ],
});

export const BoardListContextProvider__Internal = ({
  value: { boardListId, parentKeyName, childKeyName, defaultItems },
  children,
}: {
  value: BoardListContextValue;
  children: React.ReactNode;
}) => {
  const boardListContextParams = useMemo(
    () => ({
      boardListId,
      parentKeyName,
      childKeyName,
    }),
    [boardListId, parentKeyName, childKeyName],
  );

  const initBoardListContext = useRecoilCallback(
    ({ set }) =>
      ({ parentItems }: { parentItems: ParentItem[] }) => {
        const newDefaultBoardListContextIndexer = new BoardListContextIndexer({
          parentKeyName,
          childKeyName,
          parentItems,
        });
        // console.log(
        //   "newDefaultBoardListContextIndexer:",
        //   newDefaultBoardListContextIndexer,
        // );

        set(boardListContextAtomFamily(boardListContextParams), {
          boardListId,
          indexer: newDefaultBoardListContextIndexer,
        });
      },
    [boardListContextParams, boardListId, parentKeyName, childKeyName],
  );

  useIsomorphicLayoutEffect(() => {
    initBoardListContext({ parentItems: defaultItems ?? [] });
  }, [defaultItems, initBoardListContext]);

  return <>{children}</>;
};

export const BoardListContextProvider = ({
  value,
  children,
}: {
  value: BoardListContextValue;
  children: React.ReactNode;
}) => {
  return (
    <RecoilRoot>
      <BoardListContextProvider__Internal value={value}>
        {children}
      </BoardListContextProvider__Internal>
    </RecoilRoot>
  );
};

export const useBoardContext = ({
  boardListId,
  parentKeyName,
  childKeyName,
}: BoardListContextParams) => {
  const boardListContextParams = useMemo(
    () => ({
      boardListId,
      parentKeyName,
      childKeyName,
    }),
    [boardListId, parentKeyName, childKeyName],
  );

  const [stateBoardListContext, setStateBoardListContext] = useRecoilState(
    boardListContextAtomFamily(boardListContextParams),
  );

  const parentItems = stateBoardListContext.indexer.parentItems;

  return {
    parentItems__Immutable: parentItems,
    stateBoardListContext,
    setStateBoardListContext,
  };
};
