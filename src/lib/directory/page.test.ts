import { describe, expect, it } from "vitest";
import { directoryPage } from "./page";

describe("directory page window", () => {
  const items = Array.from({ length: 331 }, (_, index) => index + 1);

  it("shows a bounded page and the last partial page", () => {
    const first = directoryPage(items, 0, 12);
    expect(first.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(first.pages).toBe(28);
    const last = directoryPage(items, 99, 12);
    expect(last.page).toBe(27);
    expect(last.start).toBe(324);
    expect(last.items).toHaveLength(7);
    expect(last.items[0]).toBe(325);
    expect(last.items.at(-1)).toBe(331);
  });

  it("returns an empty window without skipping the only page", () => {
    const empty = directoryPage([], 4, 12);
    expect(empty.total).toBe(0);
    expect(empty.page).toBe(0);
    expect(empty.items).toEqual([]);
  });
});
