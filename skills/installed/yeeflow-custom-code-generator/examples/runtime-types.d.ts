declare module 'react' {
  export = React;
}

declare namespace React {
  class Component<P, S> {
    constructor(props: P);
    props: P;
    state: S;
    setState(state: Partial<S>, callback?: () => void): void;
  }
}

interface CodeInComp {
  description(): string;
  inputParameters(): any[];
  requiredFields(params: any): string[];
  render(context: any, fieldsValues: any, readonly: boolean): any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
