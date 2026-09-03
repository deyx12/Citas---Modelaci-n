import type { HTMLAttributes } from "react";

export function Table(props: HTMLAttributes<HTMLTableElement>) {
  return <table {...props} />;
}
