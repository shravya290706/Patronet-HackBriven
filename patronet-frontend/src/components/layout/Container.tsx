import * as React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = "",
  as: Component = "div",
  ...props
}) => {
  const Comp = Component as any;
  return (
    <Comp
      className={`w-full max-w-7xl mx-auto px-gutter ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
};
