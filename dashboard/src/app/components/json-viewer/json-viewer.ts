import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "json-viewer",
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-viewer.html',
  styleUrl: './json-viewer.scss',
})
export class JsonViewerComponent {
  @Input() data: any;
  parsed: any = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.data) return;

    if (typeof this.data === "object") {
      this.parsed = this.data;
      return;
    }

    if (typeof this.data === "string") {
      try {
        this.parsed = JSON.parse(this.data);
      } catch {
        this.parsed = { invalid_json: this.data };
      }
    }
  }

  getKeys(obj: any): string[] {
    if (Array.isArray(obj)) return obj.map((_, i) => i.toString());
    return Object.keys(obj ?? {});
  }


  isObject(value: any) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  isArray(value: any) {
    return Array.isArray(value);
  }

  isComplex(value: any) {
    return this.isObject(value) || this.isArray(value);
  }

  formatPrimitive(value: any) {
    if (typeof value === "string") return `"${value}"`;
    return value;
  }
}
