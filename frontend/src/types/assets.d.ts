declare module '*.ndjson' {
  const src: string;
  export default src;
}

declare module '*.ndjson?raw' {
  const src: string;
  export default src;
}
