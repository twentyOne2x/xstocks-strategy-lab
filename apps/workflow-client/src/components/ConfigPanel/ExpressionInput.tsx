import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { registry } from "@xstocks/workflow-shared";
import { useWorkflowStore } from "../../store/workflowStore";

const EXPR_RE = /\{\{([^.}]+)\.([^}]+)\}\}/g;

export interface ExpressionInputHandle {
  insertReference: (nodeId: string, key: string) => void;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

/** Build a node-id → {name, icon} lookup from the store */
function useNodeMap() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const map = new Map<string, { name: string; icon: string }>();
  for (const n of nodes) {
    const def = registry[n.data.definitionId as string];
    map.set(n.id, {
      name: def?.name ?? (n.data.label as string) ?? n.id.slice(0, 6),
      icon: def?.icon ?? (n.data.icon as string) ?? "\u2699\uFE0F",
    });
  }
  return map;
}

/** Create a pill DOM element */
function createPill(
  nodeId: string,
  key: string,
  nodeMap: Map<string, { name: string; icon: string }>
): HTMLSpanElement {
  const info = nodeMap.get(nodeId);
  const name = info?.name ?? nodeId.slice(0, 6);
  const icon = info?.icon ?? "\u2699\uFE0F";

  const pill = document.createElement("span");
  pill.contentEditable = "false";
  pill.dataset.nodeId = nodeId;
  pill.dataset.key = key;
  pill.className =
    "inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-accent/15 border border-accent/25 text-[11px] align-middle whitespace-nowrap select-none";
  pill.title = `{{${nodeId}.${key}}}`;

  pill.innerHTML =
    `<span class="text-[10px]">${icon}</span>` +
    `<span class="text-accent font-medium">${escHtml(name)}</span>` +
    `<span class="text-gray-500">.</span>` +
    `<span class="text-green-400 font-mono text-[10px]">${escHtml(key)}</span>` +
    `<span class="ml-0.5 cursor-pointer text-gray-500 hover:text-red-400" data-remove="1">\u00d7</span>`;

  return pill;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Read the contentEditable DOM back into a value string */
function domToValue(container: HTMLElement): string {
  let result = "";
  for (const child of container.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent ?? "";
    } else if (child instanceof HTMLElement) {
      if (child.dataset.nodeId && child.dataset.key) {
        result += `{{${child.dataset.nodeId}.${child.dataset.key}}}`;
      } else if (child.tagName === "BR") {
        result += "\n";
      } else {
        result += child.textContent ?? "";
      }
    }
  }
  return result;
}

export const ExpressionInput = forwardRef<ExpressionInputHandle, Props>(
  function ExpressionInput({ value, onChange, placeholder, multiline, className }, ref) {
    const divRef = useRef<HTMLDivElement>(null);
    const nodeMap = useNodeMap();
    const lastValueRef = useRef(value);
    const isFocusedRef = useRef(false);

    /** Render string value → DOM with pills */
    const renderDom = useCallback(
      (val: string) => {
        const div = divRef.current;
        if (!div) return;

        // Save whether div is focused
        const hadFocus = document.activeElement === div;

        div.innerHTML = "";
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        EXPR_RE.lastIndex = 0;

        while ((match = EXPR_RE.exec(val)) !== null) {
          // Text before this pill
          if (match.index > lastIndex) {
            const text = val.slice(lastIndex, match.index);
            div.appendChild(document.createTextNode(text));
          }
          div.appendChild(createPill(match[1], match[2], nodeMap));
          lastIndex = match.index + match[0].length;
        }
        // Trailing text
        if (lastIndex < val.length) {
          div.appendChild(document.createTextNode(val.slice(lastIndex)));
        }

        // Restore focus to the end if it was focused
        if (hadFocus) {
          const sel = window.getSelection();
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(div);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      },
      [nodeMap]
    );

    // Initial render + sync on external value changes (but NOT while user is editing)
    useEffect(() => {
      if (isFocusedRef.current) return; // Don't clobber DOM while user is typing
      if (value !== lastValueRef.current || !divRef.current?.childNodes.length) {
        renderDom(value);
        lastValueRef.current = value;
      }
    }, [value, renderDom]);

    // Re-render pills when nodeMap changes (node renamed, etc.) — only when not focused
    useEffect(() => {
      if (isFocusedRef.current) return;
      const currentVal = divRef.current ? domToValue(divRef.current) : "";
      if (currentVal === value) renderDom(value);
    }, [nodeMap, renderDom, value]);

    /** Input handler — sync DOM → string value */
    function handleInput() {
      if (!divRef.current) return;
      const newVal = domToValue(divRef.current);
      lastValueRef.current = newVal;
      onChange(newVal);
    }

    /** Click handler — remove pills via × button */
    function handleClick(e: React.MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.dataset.remove) {
        const pill = target.closest("[data-node-id]");
        if (pill) {
          pill.remove();
          handleInput();
        }
      }
    }

    /** Paste — strip HTML, plain text only */
    function handlePaste(e: React.ClipboardEvent) {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      handleInput();
    }

    /** Prevent Enter in single-line mode */
    function handleKeyDown(e: React.KeyboardEvent) {
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
      }
    }

    function handleFocus() {
      isFocusedRef.current = true;
    }

    function handleBlur() {
      isFocusedRef.current = false;
      // Re-render pills on blur to restore clean pill display
      if (divRef.current) {
        const currentVal = domToValue(divRef.current);
        lastValueRef.current = currentVal;
        renderDom(currentVal);
      }
    }

    /** Expose insertReference to parent via ref */
    useImperativeHandle(ref, () => ({
      insertReference(nodeId: string, key: string) {
        const div = divRef.current;
        if (!div) return;
        div.focus();

        const pill = createPill(nodeId, key, nodeMap);
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(pill);
          // Add a zero-width space after the pill so cursor can be placed there
          const spacer = document.createTextNode("\u200B");
          pill.after(spacer);
          range.setStartAfter(spacer);
          range.setEndAfter(spacer);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          div.appendChild(pill);
        }
        handleInput();
      },
    }));

    const isEmpty = !value;

    return (
      <div className="relative">
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onClick={handleClick}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={className}
        />
        {isEmpty && placeholder && (
          <div className="absolute top-0 left-0 px-3 py-1.5 text-sm text-gray-600 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    );
  }
);
