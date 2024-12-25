// Defines the callbacks the sensor can invoke on @hello-pangea/dnd.
// Adjust based on your actual usage/needs.
interface SensorCallbacks {
  onLift: (args: {
    clientSelection: { x: number; y: number };
    movementMode?: "FLUID" | "SNAP";
  }) => void;
  onMove: (point: { x: number; y: number }) => void;
  onDrop: () => void;
  onWindowScroll?: () => void; // optional, if you need it
}

//The arguments required to create our custom horizontal-scroll sensor.
interface CreateHorizontalScrollSensorArgs {
  callbacks: SensorCallbacks;
  //Determines if we should start capturing this event (e.g., ignoring right-clicks, etc.).
  canStartCapturing: (event: MouseEvent) => boolean;
  //Returns the window object used by @hello-pangea/dnd. Usually just `() => window`.
  getWindow: () => Window;
  //Optionally returns the draggable's underlying DOM element.
  //Not strictly necessary if you don't need it in this sensor.
  getDraggableRef?: () => HTMLElement | null;
}

// The shape of the sensor’s event handlers that @hello-pangea/dnd will attach.
interface HorizontalScrollSensor {
  onMouseDown: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: (event: MouseEvent) => void;
}

// Creates a custom sensor that handles horizontal scrolling and informs
// @hello-pangea/dnd of drag movements via onLift, onMove, and onDrop callbacks.
function createHorizontalScrollSensor({
  callbacks, // { onLift, onMove, onDrop, onWindowScroll, ... }
  canStartCapturing, // function(event) => bool (should we start dragging?)
  getWindow, // function => window
  getDraggableRef, // function => HTMLElement being dragged (optional)
}: CreateHorizontalScrollSensorArgs): HorizontalScrollSensor {
  let isDragging = false;

  // Identify the container you want to scroll.
  // This should be the same element recognized by your Droppable if possible.
  let scrollContainer: HTMLElement | null = null;

  // Called on mousedown
  function onMouseDown(event: MouseEvent) {
    // Check if we should start capturing (library calls canStartCapturing first)
    if (!canStartCapturing(event)) {
      return;
    }

    // For simplicity, assume we know our scroll container by ID or ref:
    scrollContainer = document.querySelector(
      "[data-scroll-container-id]='category-task-board'",
    );
    console.log(scrollContainer);

    // Start the drag
    callbacks.onLift({
      clientSelection: { x: event.clientX, y: event.clientY },
      movementMode: "FLUID", // or 'SNAP'
    });
    isDragging = true;

    // Prevent default to avoid text selection, etc.
    event.preventDefault();
  }

  // Called on mousemove
  function onMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    // Manual horizontal scroll if near edges
    if (scrollContainer) {
      const { left, right } = scrollContainer.getBoundingClientRect();
      const buffer = 50; // how close to the edge you start scrolling
      const scrollSpeed = 10; // how many px to scroll each move

      // If near left edge:
      if (event.clientX - left < buffer) {
        scrollContainer.scrollLeft -= scrollSpeed;
      }
      // If near right edge:
      else if (right - event.clientX < buffer) {
        scrollContainer.scrollLeft += scrollSpeed;
      }
    }

    // Tell @hello-pangea/dnd we moved
    callbacks.onMove({
      x: event.clientX,
      y: event.clientY,
    });
  }

  // Called on mouseup
  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;

    // Finish the drag
    callbacks.onDrop();
  }

  // Return the event handlers for the library to attach
  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
  };
}

export default createHorizontalScrollSensor;
