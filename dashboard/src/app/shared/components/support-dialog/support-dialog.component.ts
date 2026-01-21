import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { SelectModule } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { SupportService } from "@core/services/support.service";
import {
  SupportTicket,
  SUPPORT_TYPES,
  CATEGORIES_BY_TYPE,
} from "@models/support.types";

@Component({
  selector: "app-support-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
  ],
  templateUrl: "./support-dialog.component.html",
  styles: [
    `
      ::ng-deep {
        // Select and Multiselect Triggers
        .p-select,
        .p-paginator .p-select {
          border-radius: 0.75rem !important; // rounded-xl
        }

        // Options
        .p-select-option {
          border-radius: 0.75rem !important; // rounded-xl
          margin: 4px 4px;
        }

        // Panels
        .p-select-panel,
        .p-select-list-container,
        .p-select-overlay,
        .p-select-list {
          border-radius: 0.75rem !important; // rounded-xl
        }
      }
    `,
  ],
  providers: [MessageService],
})
export class SupportDialogComponent {
  private supportService = inject(SupportService);
  private messageService = inject(MessageService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  supportForm: SupportTicket = {
    subject: "",
    message: "",
    Types: "Bug",
    Category: "Dashboard",
  };
  supportSubmitting = false;

  supportTypes = SUPPORT_TYPES;
  currentCategories: string[] = [];

  constructor() {
    this.onTypeChange();
  }

  onTypeChange() {
    this.currentCategories = CATEGORIES_BY_TYPE[this.supportForm.Types] || [];
    if (!this.currentCategories.includes(this.supportForm.Category as string)) {
      this.supportForm.Category = this.currentCategories[0] as any;
    }
  }

  closeDialog() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  resetForm() {
    this.supportForm = {
      subject: "",
      message: "",
      Types: "Bug",
      Category: "Dashboard",
    };
    this.onTypeChange();
  }

  submitForm() {
    if (
      !this.supportForm.subject ||
      !this.supportForm.message ||
      !this.supportForm.Category
    ) {
      this.messageService.add({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all fields",
      });
      return;
    }

    this.supportSubmitting = true;

    this.supportService.createTicket(this.supportForm).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: "Support ticket created successfully",
        });
        this.supportSubmitting = false;
        this.closeDialog();
      },
      error: (error) => {
        console.error("Failed to create ticket:", error);
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to create support ticket",
        });
        this.supportSubmitting = false;
      },
    });
  }
}
