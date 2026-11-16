export namespace MarkdownUtil {
  // Keep Unicode letters and underscores, including those in mapped table names.
  const punctuation = new RegExp("[^\\p{L}\\p{M}\\p{N}_ -]", "gu");

  export const bookmark = (heading: string): string =>
    heading.toLowerCase().replace(punctuation, "").replace(/ /g, "-");

  export const createBookmarker = (): ((heading: string) => string) => {
    const used = new Set<string>();
    return (heading) => {
      const base: string = bookmark(heading);
      let anchor: string = base;
      let suffix: number = 0;
      while (used.has(anchor)) anchor = `${base}-${++suffix}`;
      used.add(anchor);
      return anchor;
    };
  };
}
