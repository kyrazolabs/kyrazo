import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";

@Component({
  selector: "app-inspector.page",
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: "./inspector.page.html",
  styleUrl: "./inspector.page.scss",
})
export class InspectorPage {
  email = "";
  loading = false;

  subscribe() {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.email = "";
    }, 2000);
  }
}
