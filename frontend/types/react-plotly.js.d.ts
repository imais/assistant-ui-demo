declare module "react-plotly.js" {
  import { Component } from "react";
  import { Data, Layout, Config } from "plotly.js";

  export interface PlotParams {
    data: Data[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
    style?: React.CSSProperties;
    className?: string;
    revision?: number;
    onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
    onPurge?: (figure: any, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    debug?: boolean;
    useResizeHandler?: boolean;
  }

  export default class Plot extends Component<PlotParams> {}
}

