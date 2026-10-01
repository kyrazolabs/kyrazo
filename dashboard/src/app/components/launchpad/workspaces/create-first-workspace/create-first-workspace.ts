import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WorkspaceService } from '@core/services/workspace.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-create-first-workspace',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        ScrollRevealDirective,
    ],
    templateUrl: './create-first-workspace.html',
    styleUrl: './create-first-workspace.scss',
})
export class CreateFirstWorkspace {
    private fb = inject(FormBuilder);
    private workspaceService = inject(WorkspaceService);
    private messageService = inject(MessageService);

    @Output() workspaceCreated = new EventEmitter<any>();

    readonly loading = signal(false);

    readonly form = this.fb.group({
        name: [
            '',
            [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(50),
            ],
        ],
        description: ['', [Validators.maxLength(500)]],
    });

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const payload = this.form.getRawValue() as any;

        this.workspaceService.create(payload).subscribe({
            next: (response) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Workspace created successfully!',
                });
                this.workspaceCreated.emit(response.data);
            },
            error: (error: any) => {
                this.loading.set(false);
                const errorMessage =
                    error.error?.error?.code === 'LIMIT_EXCEEDED'
                        ? 'Workspace limit exceeded for your current plan.'
                        : error.error?.error?.message ||
                          error.message ||
                          'Failed to create workspace';

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage,
                });
            },
        });
    }
}
