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

class VisualFocusManager {
  private container: HTMLElement;
  private opts: Required<VisualFocusManagerOptions>;
  private els: HTMLElement[][] = [];
  private order: number[] = []; // indices into els in visual order
  private originalTabIndex = new WeakMap<HTMLElement, number>(); // bookkeeping for original tabIndex without DOM attributes
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

    // restore original tabIndex
    for (const el of this.els) {
      const orig = this.originalTabIndex.get(el[0]);
      if (orig != null) el[0].tabIndex = orig;
    }

    this.originalTabIndex = new WeakMap();
    this.els = [];
    this.order = [];
  }

  private updateFocusable() {
    const all = Array.from(this.container.children).reduce<HTMLElement[][]>(
      (acc, el) => {
        if (!(el instanceof HTMLElement)) return acc;
        const childEls: HTMLElement[] = [];

        el.querySelectorAll(DEFAULTS.focusableSelector).forEach(
          (el) => el instanceof HTMLElement && childEls.push(el)
        );

        if (isInteractive(el)) acc.push([el, ...childEls]);
        else acc.push(childEls);
        return acc;
      },
      []
    );

    const allFlat = all.flat();
    for (const el of this.els.flat()) {
      if (!allFlat.includes(el)) {
        const orig = this.originalTabIndex.get(el); // restore any that dropped out
        if (orig != null) el.tabIndex = orig;
      }
    }

    this.els = all; // set new list + normalize tabindex

    for (const el of this.els.flat()) {
      if (!this.originalTabIndex.has(el)) {
        this.originalTabIndex.set(el, el.tabIndex ?? 0); // record once; default to 0 if unspecified
      }
      el.tabIndex = -1;
    }
  }

  private recomputeOrder() {
    this.order = [];
    if (!this.els.length) return;

    const crect = this.container.getBoundingClientRect();

    // collect geometry once
    const items = this.els.map((item, idx) => {
      const el = item[0];
      const r = el.getBoundingClientRect();
      const cx = r.left - crect.left + r.width / 2;
      const cy = r.top - crect.top + r.height / 2;
      const top = r.top - crect.top;
      return { el, idx, cx, cy, top };
    });

    // cluster columns by cx using xTolerance
    const cols: number[][] = []; // each is list of item indices into items
    const sorted = [...items].sort((a, b) => a.cx - b.cx);
    for (const it of sorted) {
      const last = cols[cols.length - 1];
      if (!last) {
        cols.push([it.idx]);
      } else {
        const prev = items[last[last.length - 1]];
        if (Math.abs(it.cx - prev.cx) <= this.opts.xTolerance) {
          last.push(it.idx);
        } else {
          cols.push([it.idx]);
        }
      }
    }

    // sort each column top->bottom (stable on near ties)
    for (const col of cols) {
      col.sort((a, b) => {
        const dy = items[a].top - items[b].top;
        if (Math.abs(dy) > this.opts.yTolerance) return dy;
        return a - b; // DOM order tie-breaker
      });
    }

    // interleave columns by rows: top of each col, left->right
    const maxRows = Math.max(...cols.map((c) => c.length));
    for (let row = 0; row < maxRows; row++) {
      for (let c = 0; c < cols.length; c++) {
        const idx = cols[c][row];
        if (idx != null) this.order.push(idx);
      }
    }

    // only the first is tabbable
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

export default VisualFocusManager;
