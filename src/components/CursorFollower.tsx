import React, { useState } from "react";

export const CursorFollower = React.memo(
  React.forwardRef<HTMLDivElement, {}>((props, ref) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });
    };

    return (
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        style={{
          height: "100vh",
          width: "100%",
          backgroundColor: "#f0f0f0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: position.y,
            left: position.x,
            transform: "translate(-50%, -50%)",
            width: "20px",
            height: "20px",
            backgroundColor: "red",
            borderRadius: "50%",
            pointerEvents: "none", // Ensures the follower doesn't block interaction
          }}
        />
        <h1>Move your mouse around!</h1>
      </div>
    );
  }),
);
