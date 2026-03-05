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
import { NamespaceService } from '@core/services/namespace.service';
import { INamespace } from '@models/namespace.types';
import { TagModule } from 'primeng/tag';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { ISubscription } from '@models/billing.types';
import { DialogService } from '@shared/services/dialog.service';
import { SubscriptionService } from '@core/services/subscription.service';

@Component({
    selector: 'app-create-first-namespace',
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
    templateUrl: './create-first-namespace.html',
    styleUrls: ['./create-first-namespace.scss'],
})
export class CreateFirstNamespaceComponent {
    @Input() visible = false;
    @Input() workspaceId?: string;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() namespaceCreated = new EventEmitter<INamespace>();
    @Output() skipped = new EventEmitter<void>();

    namespaceForm: FormGroup;
    isCreating = false;

    constructor(
        private fb: FormBuilder,
        private namespaceService: NamespaceService,
        private messageService: MessageService,
        public subscriptionService: SubscriptionService,
        public dialogService: DialogService,
    ) {
        this.namespaceForm = this.fb.group({
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
        // Auto-focus the namespace name input when dialog opens
        setTimeout(() => {
            const nameInput = document.getElementById(
                'namespaceName',
            ) as HTMLInputElement;
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);
    }

    onCreate() {
        if (this.namespaceForm.valid && this.workspaceId) {
            this.isCreating = true;

            const formValue = this.namespaceForm.value;
            const namespaceData = {
                name: formValue.name,
                description: formValue.description || '',
                whiteLabelHeaders: formValue.whiteLabelHeaders || '',
                workspaceId: this.workspaceId,
            };

            this.namespaceService.create(namespaceData).subscribe({
                next: (response) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success!',
                        detail: 'Your first namespace has been created successfully! 🎉',
                    });

                    this.namespaceCreated.emit(response.data.namespace);
                    this.closeDialog();
                    this.isCreating = false;
                },
                error: (error) => {
                    console.error('Failed to create namespace:', error);
                    const errorMessage =
                        error.error?.error?.code === 'LIMIT_EXCEEDED'
                            ? 'Namespace limit exceeded for your current plan.'
                            : 'Failed to create namespace. Please try again.';

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
            Object.keys(this.namespaceForm.controls).forEach((key) => {
                this.namespaceForm.get(key)?.markAsTouched();
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
        this.namespaceForm.reset();
        this.isCreating = false;
    }

    // Public method to open the dialog
    open() {
        this.visible = true;
        this.visibleChange.emit(true);
        this.namespaceForm.reset();
    }
}
