/** paged.js 0.4.3 не поставляет типы — только то, что использует буклет разбора (src/components/RazborBooklet.tsx). */
declare module "pagedjs" {
  export class Previewer {
    constructor(options?: Record<string, unknown>);
    preview(content: Element | DocumentFragment | string, stylesheets: (string | Record<string, string>)[], renderTo: Element): Promise<{ total: number }>;
  }
}
