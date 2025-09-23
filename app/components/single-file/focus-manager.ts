interface VisualFocusManagerOptions {
  focusableSelector?: string;
  skipHidden?: boolean;
  yTolerance?: number; // group items within a column by top proximity
  xTolerance?: number; // cluster columns
}

const DEFAULTS: Required<VisualFocusManagerOptions> = {
  focusableSelector:
    '[tabindex]:not([tabindex="-1"]), button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
  skipHidden: true,
  yTolerance: 6,
  xTolerance: 12,
};

class GridFocusManager {
  private container: HTMLElement;
  private opts: Required<VisualFocusManagerOptions>;
  private els: HTMLElement[][] = [];
  private order: number[] = []; // indices into els in visual order
  private originalTabIndex = new WeakMap<HTMLElement, string | null>();
  private ro?: ResizeObserver;
  private controller = new AbortController();

  constructor(container: HTMLElement, options: VisualFocusManagerOptions = {}) {
    this.container = container;
    this.opts = { ...DEFAULTS, ...options };
    this.refresh();

    const { signal } = this.controller;
    this.container.addEventListener("keydown", this.handleKeyDown.bind(this), {
      signal,
    });
    this.container.addEventListener("focusin", this.handleFocusIn.bind(this), {
      signal,
    });
    this.ro = new ResizeObserver(() => this.refresh());
    this.ro.observe(this.container);
  }

  public refresh() {
    this.updateFocusable();
    this.recomputeOrder();
  }

  public focusFirst() {
    const vi = 0;
    if (this.order.length) this.els[this.order[vi]][0]?.focus();
  }

  public focusLast() {
    const vi = this.order.length - 1;
    if (vi >= 0) this.els[this.order[vi]][0]?.focus();
  }

  public destroy() {
    this.ro?.disconnect();
    this.controller.abort();

    // restore everyone currently tracked
    for (const el of this.els.flat()) {
      const saved = this.originalTabIndex.get(el);
      if (saved !== undefined) {
        if (saved === null) el.removeAttribute("tabindex");
        else el.setAttribute("tabindex", saved);
      }
    }

    this.originalTabIndex = new WeakMap();
    this.els = [];
    this.order = [];
  }

  private updateFocusable() {
    const nextEls = Array.from(this.container.children).reduce<HTMLElement[][]>(
      (acc, el) => {
        if (!(el instanceof HTMLElement)) return acc;
        const childEls = Array.from(
          el.querySelectorAll<HTMLElement>(this.opts.focusableSelector)
        );
        if (isInteractive(el)) acc.push([el, ...childEls]);
        else acc.push(childEls);
        return acc;
      },
      []
    );

    const prevFlat = this.els.flat();
    const nextFlat = nextEls.flat();

    // Restore any elements that dropped out
    for (const el of prevFlat) {
      if (!nextFlat.includes(el)) {
        const saved = this.originalTabIndex.get(el);
        if (saved !== undefined) {
          if (saved === null) el.removeAttribute("tabindex");
          else el.setAttribute("tabindex", saved);
        }
        this.originalTabIndex.delete(el);
      }
    }

    // Swap to new list
    this.els = nextEls;

    // Record originals for current elements (once) and set to -1
    for (const el of nextFlat) {
      if (!this.originalTabIndex.has(el)) {
        // preserve attribute presence and exact value
        this.originalTabIndex.set(el, el.getAttribute("tabindex"));
      }
      el.tabIndex = -1;
    }
  }

  private recomputeOrder() {
    if (!this.els.length) return;

    this.order = [];
    const { xTolerance, yTolerance } = this.opts;
    const cRect = this.container.getBoundingClientRect();

    // 1) Measure once
    const items = this.els.map((group, idx) => {
      const r = group[0].getBoundingClientRect();
      const cx = r.left - cRect.left + r.width / 2;
      const top = r.top - cRect.top;
      return { idx, cx, top };
    });

    // 2) Cluster columns by cx (greedy)
    const cols: number[][] = [];
    for (const it of [...items].sort((a, b) => a.cx - b.cx)) {
      const col = cols[cols.length - 1];
      if (!col) {
        cols.push([it.idx]);
        continue;
      }
      const prev = items[col[col.length - 1]];
      if (Math.abs(it.cx - prev.cx) <= xTolerance) col.push(it.idx);
      else cols.push([it.idx]);
    }

    // 3) Sort each column top->bottom (stable on near-ties)
    for (const col of cols) {
      col.sort((a, b) => {
        const dy = items[a].top - items[b].top;
        return Math.abs(dy) > yTolerance ? dy : a - b; // DOM-order tiebreaker
      });
    }

    // 4) Interleave columns row-by-row (no maxRows needed)
    const pos = cols.map(() => 0);
    let remaining = cols.reduce((n, c) => n + c.length, 0);
    while (remaining) {
      for (let c = 0; c < cols.length; c++) {
        const p = pos[c];
        if (p < cols[c].length) {
          this.order.push(cols[c][p]);
          pos[c] = p + 1;
          remaining--;
        }
      }
    }

    // 5) Only first is tabbable
    this.els.flat().forEach((el) => (el.tabIndex = -1));
    const firstIdx = this.order[0];
    if (firstIdx != null) this.els[firstIdx][0].tabIndex = 0;
  }

  private handleKeyDown(e: KeyboardEvent) {
    const t = e.target;
    if (!(t instanceof HTMLElement) || !this.container.contains(t)) return;

    const gridIdx = this.els.findIndex((els) => els.includes(t));
    if (gridIdx === -1) return;

    const visualIdx = this.order.indexOf(gridIdx);
    if (visualIdx === -1) return;

    if (e.key === "Tab") this.handleTabKey(e, gridIdx, visualIdx);
  }

  private handleTabKey(e: KeyboardEvent, groupIndex: number, visIndex: number) {
    if (!(e.target instanceof HTMLElement)) return;

    if (this.els[groupIndex].length > 1) {
      const elIndex = this.els[groupIndex].indexOf(e.target);
      const numEls = this.els[groupIndex].length;
      if (!e.shiftKey && elIndex >= 0 && elIndex + 1 < numEls) {
        e.preventDefault();
        this.els[groupIndex][elIndex + 1].focus();
        return;
      } else if (e.shiftKey && elIndex > 0) {
        e.preventDefault();
        this.els[groupIndex][elIndex - 1].focus();
        return;
      }
    }

    const next = visIndex + (e.shiftKey ? -1 : 1);
    if (next < 0 || next >= this.order.length || next === visIndex) return;

    e.preventDefault();
    const targetArr = this.els[this.order[next]];

    if (targetArr.length > 1 && e.shiftKey) {
      targetArr[targetArr.length - 1]?.focus();
    } else {
      targetArr[0]?.focus();
    }
  }

  private handleFocusIn(e: FocusEvent) {
    const t = e.target;
    const rt = e.relatedTarget;
    if (!(t instanceof HTMLElement) || !(rt instanceof HTMLElement)) return;
    // If focus entered from outside (no relatedTarget inside container),
    // decide whether to start at last element (matching original logic).
    if (this.container.contains(rt)) return;
    // defer to let browser settle the incoming focus
    if (this.shouldFocusLast(rt)) requestAnimationFrame(() => this.focusLast());
  }

  private shouldFocusLast(from: HTMLElement | null) {
    if (!from) return false;

    const docFocusable = Array.from(
      document.querySelectorAll(DEFAULTS.focusableSelector)
    ).filter((el): el is HTMLElement => {
      if (!(el instanceof HTMLElement)) return false;
      const s = getComputedStyle(el);
      return (
        s.display !== "none" &&
        s.visibility !== "hidden" &&
        el.offsetParent !== null
      );
    });

    const firstInContainer = docFocusable.findIndex((el) =>
      this.container.contains(el)
    );
    const fromPos = docFocusable.indexOf(from);

    return firstInContainer !== -1 && fromPos > firstInContainer;
  }
}

function isInteractive(el: Element) {
  return ["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"].includes(el.tagName);
}

export default GridFocusManager;
