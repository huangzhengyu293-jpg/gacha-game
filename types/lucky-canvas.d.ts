declare module '@lucky-canvas/react' {
  import { Component } from 'react';

  export class SlotMachine extends Component<any> {
    play(): void;
    stop(index: number): void;
    init(): void;
  }

  export class LuckyWheel extends Component<any> {
    play(): void;
    stop(index: number): void;
  }

  export class LuckyGrid extends Component<any> {
    play(): void;
    stop(index: number): void;
  }
}

declare module 'lucky-canvas/react' {
  export * from '@lucky-canvas/react';
}

