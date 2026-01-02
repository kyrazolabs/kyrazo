import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

// PrimeNG
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { DialogModule } from "primeng/dialog";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { TagModule } from "primeng/tag";
import { CardModule } from "primeng/card";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TooltipModule } from "primeng/tooltip";
import { MenuModule } from "primeng/menu";

// Services
import { ProjectService } from "@core/services/project.service";
import { ConfirmationService, MessageService } from "primeng/api";
import { GetProjectsResponse, IProject } from "@models/project.types";
import { SentryService } from "@core/3rd-party/sentry";

@Component({
  selector: "app-projects.page",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    MenuModule,
  ],
  templateUrl: "./projects.page.html",
  styleUrl: "./projects.page.scss",
  providers: [MessageService, ConfirmationService],
})
export class ProjectsPage implements OnInit {
  private projectService = inject(ProjectService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private sentry = inject(SentryService);

  projects: IProject[] = [];
  loading = false;

  // Dialog
  projectDialog = false;
  projectForm: { name: string; description: string; _id?: string } = {
    name: "",
    description: "",
  };
  isSaving = false;
  isEdit = false;

  // Search
  searchQuery = "";

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.projectService
      .getWorkspaceProjects({ q: this.searchQuery })
      .subscribe({
        next: (res) => {
          this.projects = res.data;
          this.loading = false;
        },
        error: (err) => {
          this.sentry.captureException(err);
          this.loading = false;
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load projects",
          });
        },
      });
  }

  onSearch() {
    this.loadProjects();
  }

  openNew() {
    this.projectForm = { name: "", description: "" };
    this.isEdit = false;
    this.projectDialog = true;
  }

  editProject(project: IProject) {
    this.projectForm = {
      name: project.name,
      description: project.description || "",
      _id: project._id,
    };
    this.isEdit = true;
    this.projectDialog = true;
  }

  hideDialog() {
    this.projectDialog = false;
    this.isSaving = false;
  }

  saveProject() {
    if (!this.projectForm.name.trim()) return;

    this.isSaving = true;

    if (this.isEdit && this.projectForm._id) {
      // Update
      this.projectService
        .update(this.projectForm._id, {
          name: this.projectForm.name,
          description: this.projectForm.description,
        })
        .subscribe({
          next: (res) => {
            this.messageService.add({
              severity: "success",
              summary: "Success",
              detail: "Project updated",
            });
            this.loadProjects();
            this.hideDialog();
          },
          error: (err) => {
            this.sentry.captureException(err);
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: "Failed to update project",
            });
            this.isSaving = false;
          },
        });
    } else {
      // Create
      this.projectService
        .create({
          name: this.projectForm.name,
          description: this.projectForm.description,
        })
        .subscribe({
          next: (res) => {
            this.messageService.add({
              severity: "success",
              summary: "Success",
              detail: "Project created",
            });
            this.loadProjects();
            this.hideDialog();
            // Optionally reload window if we want to update topbar list immediately,
            // but for this page managing its own list, loadProjects is enough for the table view.
            // If topbar sync is critical, we might need a signal or subject in a shared service.
            // For now, let's just refresh the table.
          },
          error: (err) => {
            this.sentry.captureException(err);
            const errorMessage =
              err.error?.error?.code === "LIMIT_EXCEEDED"
                ? "Project limit exceeded for your current plan."
                : err.error?.error?.message ||
                  err.message ||
                  "Failed to create project";

            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: errorMessage,
            });
            this.isSaving = false;
          },
        });
    }
  }

  deleteProject(project: IProject) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the project "${project.name}"? This will permanently remove all associated configurations and data.`,
      header: "Delete Project",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.projectService.delete(project._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: "success",
              summary: "Success",
              detail: "Project deleted successfully",
            });
            this.loadProjects();
          },
          error: (err) => {
            this.sentry.captureException(err);
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: "Failed to delete project",
            });
          },
        });
      },
    });
  }
}
