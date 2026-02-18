import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProjectService } from '@core/services/project.service';
import { IProject } from '@models/project.types';
import { TagModule } from 'primeng/tag';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { ISubscription } from '@models/billing.types';
import { DialogService } from '@shared/services/dialog.service';
import { SubscriptionService } from '@core/services/subscription.service';

@Component({
    selector: 'app-create-first-project',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        ButtonModule,
        ToastModule,
        TagModule,
        ScrollRevealDirective,
    ],
    providers: [MessageService],
    templateUrl: './create-first-project.html',
    styleUrls: ['./create-first-project.scss'],
})
export class CreateFirstProjectComponent {
    @Input() visible = false;
    @Input() workspaceId?: string;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() projectCreated = new EventEmitter<IProject>();
    @Output() skipped = new EventEmitter<void>();

    projectForm: FormGroup;
    isCreating = false;

    constructor(
        private fb: FormBuilder,
        private projectService: ProjectService,
        private messageService: MessageService,
        public subscriptionService: SubscriptionService,
        public dialogService: DialogService,
    ) {
        this.projectForm = this.fb.group({
            name: [
                '',
                [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(100),
                ],
            ],
            description: ['', [Validators.maxLength(500)]],
            whiteLabelHeaders: [''],
        });
    }

    get hasWhiteLabelFeature(): boolean {
        return !!this.subscriptionService.subscription()?.planSnapshot?.features
            ?.whiteLabelHeaders;
    }

    ngOnInit() {
        // Auto-focus the project name input when dialog opens
        setTimeout(() => {
            const nameInput = document.getElementById(
                'projectName',
            ) as HTMLInputElement;
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);
    }

    onCreate() {
        if (this.projectForm.valid && this.workspaceId) {
            this.isCreating = true;

            const formValue = this.projectForm.value;
            const projectData = {
                name: formValue.name,
                description: formValue.description || '',
                whiteLabelHeaders: formValue.whiteLabelHeaders || '',
                workspaceId: this.workspaceId,
            };

            this.projectService.create(projectData).subscribe({
                next: (response) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success!',
                        detail: 'Your first project has been created successfully! 🎉',
                    });

                    this.projectCreated.emit(response.data.project);
                    this.closeDialog();
                    this.isCreating = false;
                },
                error: (error) => {
                    console.error('Failed to create project:', error);
                    const errorMessage =
                        error.error?.error?.code === 'LIMIT_EXCEEDED'
                            ? 'Project limit exceeded for your current plan.'
                            : 'Failed to create project. Please try again.';

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: errorMessage,
                    });
                    this.isCreating = false;
                },
            });
        } else {
            // Mark all fields as touched to show validation errors
            Object.keys(this.projectForm.controls).forEach((key) => {
                this.projectForm.get(key)?.markAsTouched();
            });
        }
    }

    onSkip() {
        this.skipped.emit();
        this.closeDialog();
    }

    closeDialog() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.projectForm.reset();
        this.isCreating = false;
    }

    // Public method to open the dialog
    open() {
        this.visible = true;
        this.visibleChange.emit(true);
        this.projectForm.reset();
    }
}
