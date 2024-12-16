import { createPortal } from "react-dom";
import { useLikeConstructor } from "@/hooks/useLikeConstructor";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { styled } from "styled-components";
import { GripVertical } from "react-bootstrap-icons";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";

declare global {
  interface Performance {
    memory?: {
      totalJSHeapSize: number; // Total memory allocated for the JS heap
      usedJSHeapSize: number; // Memory currently being used in the JS heap
      jsHeapSizeLimit: number; // Memory limit for the JS heap
    };
  }
}

class Stats {
  public container: HTMLDivElement;

  public mode: number;
  public frames = 0;
  public beginTime: number;
  public prevTime: number;

  public fpsPanel: Panel | null;
  public msPanel: Panel | null;
  public memPanel: Panel | null;

  constructor() {
    this.mode = 0;
    this.frames = 0;
    this.beginTime = (performance || Date).now();
    this.prevTime = this.beginTime;

    this.container = document.createElement("div");
    this.container.style.cssText =
      "position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";
    this.container.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        this.showPanel(++this.mode % this.container.children.length);
      },
      false,
    );

    this.fpsPanel = this.addPanel(
      new Panel({
        name: "FPS",
        foregroundColor: "#0ff",
        backgroundColor: "#002",
      }),
    );
    this.msPanel = this.addPanel(
      new Panel({
        name: "MS",
        foregroundColor: "#0f0",
        backgroundColor: "#020",
      }),
    );

    if (self.performance && self.performance.memory) {
      this.memPanel = this.addPanel(
        new Panel({
          name: "MB",
          foregroundColor: "#f08",
          backgroundColor: "#201",
        }),
      );
    } else {
      this.memPanel = null;
    }

    this.showPanel(0);
  }

  begin() {
    this.beginTime = (performance || Date).now();
  }

  end() {
    // let prevTime = this.beginTime;
    let time = (performance || Date).now();

    this.frames++;
    this.msPanel?.update(time - this.beginTime, 200);

    if (time >= this.prevTime + 1000) {
      this.fpsPanel?.update((this.frames * 1000) / (time - this.prevTime), 100);

      this.prevTime = time;
      this.frames = 0;

      if (this.memPanel && performance.memory) {
        const memory = performance.memory;
        this.memPanel.update(
          memory.usedJSHeapSize / 1048576,
          memory.jsHeapSizeLimit / 1048576,
        );
      }
    }

    return time;
  }

  update() {
    this.beginTime = this.end();
  }

  addPanel(panel: Panel) {
    this.container.appendChild(panel.canvas);
    return panel;
  }

  showPanel(id: number) {
    for (let i = 0; i < this.container.children.length; i++) {
      (this.container.children[i] as HTMLElement).style.setProperty(
        "display",
        i === id ? "block" : "none",
      );
    }

    this.mode = id;
  }
}

export class Panel {
  public context: CanvasRenderingContext2D | null; //ReturnType<HTMLCanvasElement["getContext"]>;
  public canvas: HTMLCanvasElement;
  public min = Infinity;
  public max = 0;

  public name: string;
  public backgroundColor: string;
  public foregroundColor: string;

  public WIDTH: number;
  public HEIGHT: number;
  public TEXT_X: number;
  public TEXT_Y: number;
  public GRAPH_X: number;
  public GRAPH_Y: number;
  public GRAPH_WIDTH: number;
  public GRAPH_HEIGHT: number;

  constructor({
    name,
    foregroundColor,
    backgroundColor,
  }: {
    name: string;
    foregroundColor: string;
    backgroundColor: string;
  }) {
    const devicePixelRatio = Math.round(window.devicePixelRatio || 1);

    this.name = name;
    this.backgroundColor = backgroundColor;
    this.foregroundColor = foregroundColor;

    this.WIDTH = 80 * devicePixelRatio;
    this.HEIGHT = 48 * devicePixelRatio;
    this.TEXT_X = 3 * devicePixelRatio;
    this.TEXT_Y = 2 * devicePixelRatio;
    this.GRAPH_X = 3 * devicePixelRatio;
    this.GRAPH_Y = 15 * devicePixelRatio;
    this.GRAPH_WIDTH = 74 * devicePixelRatio;
    this.GRAPH_HEIGHT = 30 * devicePixelRatio;

    const canvas = document.createElement("canvas");
    canvas.width = this.WIDTH;
    canvas.height = this.HEIGHT;
    canvas.style.cssText = "width:80px;height:48px";
    this.canvas = canvas;

    const context = canvas.getContext("2d");
    if (context) {
      context.font =
        "bold " + 9 * devicePixelRatio + "px Helvetica,Arial,sans-serif";
      context.textBaseline = "top";

      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, this.WIDTH, this.HEIGHT);

      context.fillStyle = foregroundColor;
      context.fillText(name, this.TEXT_X, this.TEXT_Y);
      context.fillRect(
        this.GRAPH_X,
        this.GRAPH_Y,
        this.GRAPH_WIDTH,
        this.GRAPH_HEIGHT,
      );

      context.fillStyle = backgroundColor;
      context.globalAlpha = 0.9;
      context.fillRect(
        this.GRAPH_X,
        this.GRAPH_Y,
        this.GRAPH_WIDTH,
        this.GRAPH_HEIGHT,
      );
    }
    this.context = context;
  }

  update(value: number, maxValue: number) {
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);

    if (!this.context) {
      return;
    }
    const context = this.context;

    context.fillStyle = this.backgroundColor;
    context.globalAlpha = 1;
    context.fillRect(0, 0, this.WIDTH, this.GRAPH_Y);
    context.fillStyle = this.foregroundColor;

    const valueDisplay = Math.round(value);
    const nameDisplay = this.name;
    const minDisplay = Math.round(this.min);
    const maxDisplay = Math.round(this.max);
    const text = `${valueDisplay} ${nameDisplay} (${minDisplay}-${maxDisplay})`;
    context.fillText(text, this.TEXT_X, this.TEXT_Y);

    const devicePixelRatio = Math.round(window.devicePixelRatio || 1);
    context.drawImage(
      this.canvas,
      this.GRAPH_X + devicePixelRatio,
      this.GRAPH_Y,
      this.GRAPH_WIDTH - devicePixelRatio,
      this.GRAPH_HEIGHT,
      this.GRAPH_X,
      this.GRAPH_Y,
      this.GRAPH_WIDTH - devicePixelRatio,
      this.GRAPH_HEIGHT,
    );

    context.fillRect(
      this.GRAPH_X + this.GRAPH_WIDTH - devicePixelRatio,
      this.GRAPH_Y,
      devicePixelRatio,
      this.GRAPH_HEIGHT,
    );

    context.fillStyle = this.backgroundColor;
    context.globalAlpha = 0.9;
    context.fillRect(
      this.GRAPH_X + this.GRAPH_WIDTH - devicePixelRatio,
      this.GRAPH_Y,
      devicePixelRatio,
      Math.round((1 - value / maxValue) * this.GRAPH_HEIGHT),
    );
    this.context = context;
  }
}

const StatsViewerBase = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
`;

const StatsViewerDragHandle = styled.div``;

export type StatViewerHandle = {
  baseElement: HTMLElement | HTMLDivElement | null;
  statsElement: HTMLDivElement | null;
};

export type StatViewerProps = {
  appendAt?: HTMLElement;
  enableDragHandle?: boolean;
  WrapperComponent?: React.ComponentType<React.PropsWithChildren<any>>;
  // React.ForwardRefRenderFunction<
  //   HTMLElement,
  //   React.PropsWithoutRef<React.PropsWithChildren<any>>
  // >;
};

// TODO: drag to reposition
export const StatViewer = withMemoAndRef<
  "template",
  StatViewerHandle,
  StatViewerProps
>({
  displayName: "StatViewer",
  Component: (
    {
      appendAt = document.body,
      WrapperComponent,
      enableDragHandle = true,
      ...otherProps
    },
    ref,
  ) => {
    const refStats = useRef<Stats | null>(null);
    const refBase = useRef<HTMLElement | null>(null);
    const refIsRunning = useRef<boolean>(false);

    useLikeConstructor(() => {
      refStats.current = new Stats();

      refStats.current.container.style.setProperty("position", "");
      refStats.current.container.style.setProperty("top", "");
      refStats.current.container.style.setProperty("left", "");
      refStats.current.container.style.setProperty("z-index", "");
    });

    useImperativeHandle(ref, () => {
      return {
        baseElement: refBase.current,
        statsElement: refStats.current?.container ?? null,
      };
    });

    const run = useCallback(() => {
      if (!refStats.current) {
        console.warn("[run] !refStats.current");
        return;
      }
      refIsRunning.current = true;

      refStats.current.begin();
      refStats.current.end();
      requestAnimationFrame(run);
    }, []);

    useEffect(() => {
      if (!refStats.current) {
        return;
      }

      refBase.current?.appendChild(refStats.current.container);
      if (!refIsRunning.current) {
        run();
      }
      // console.log(refStats.current);

      // const _refBase = refBase.current;
      return () => {
        // if (!_refBase) {
        //   return;
        // }
        // _refBase.current?.removeChild(refStats.current.dom);
        // ㄴ This will cause an error
        // Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
      };
    }, [appendAt, WrapperComponent, run]);

    const children = enableDragHandle ? (
      <StatsViewerDragHandle draggable={true} tabIndex={0}>
        <GripVertical />
      </StatsViewerDragHandle>
    ) : null;

    return createPortal(
      WrapperComponent ? (
        <WrapperComponent {...otherProps}>
          <StatsViewerBase
            ref={refBase as React.MutableRefObject<HTMLDivElement | null>}
            {...otherProps}
          >
            {children}
          </StatsViewerBase>
        </WrapperComponent>
      ) : (
        <StatsViewerBase
          ref={refBase as React.MutableRefObject<HTMLDivElement | null>}
          {...otherProps}
        >
          {children}
        </StatsViewerBase>
      ),
      appendAt,
    );
  },
});
