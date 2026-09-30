export function bindCopyButtons(root: ParentNode = document): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>("button.copy-button[data-copy-text]");
  buttons.forEach((button) => {
    if (button.dataset.copyBound === "true") return;
    button.dataset.copyBound = "true";
    const label = button.textContent || "Copy";
    button.addEventListener("click", async () => {
      const text = button.getAttribute("data-copy-text") ?? "";
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = label;
        }, 1600);
      } catch {
        button.textContent = label;
      }
    });
  });
}

export async function copyText(
  button: HTMLButtonElement,
  text: string,
  label = "Copy",
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = label;
    }, 1600);
  } catch {
    button.textContent = label;
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => bindCopyButtons(), { once: true });
  } else {
    bindCopyButtons();
  }
}
