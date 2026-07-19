import { WidgetType } from "@codemirror/view";

export class OperatorWidget extends WidgetType {
  constructor({ text, onClick }) {
    super();
    this.text = text;
    this.onClick = onClick;
  }

  eq(other) {
    return other instanceof OperatorWidget && other.text === this.text;
  }

  toDOM() {
    const el = document.createElement("span");
    el.textContent = this.text;
    el.className = "cm-operator-pill";

    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      this.onClick();
    });

    return el;
  }
}
