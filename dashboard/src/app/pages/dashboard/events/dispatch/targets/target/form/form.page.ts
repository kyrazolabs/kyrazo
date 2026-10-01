import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
    FormArray,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TargetService, ITarget } from '@core/services/target.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PostHogService } from '@core/3rd-party/posthog';
import { finalize } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

@Component({
    selector: 'app-target-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        CheckboxModule,
        CardModule,
        ToastModule,
        InputNumberModule,
        DividerModule,
        IconFieldModule,
        InputIconModule,
        TextareaModule,
        SelectModule,
    ],
    providers: [MessageService],
    templateUrl: './form.page.html',
    styleUrl: './form.page.scss',
})
export class TargetFormPage implements OnInit {
    private fb = inject(FormBuilder);
    private targetService = inject(TargetService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private posthog = inject(PostHogService);

    form!: FormGroup;
    isEditMode = false;
    targetId: string | null = null;
    loading = false;

    methodOptions = [
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
    ];

    get customHeaders() {
        return this.form.get('customHeaders') as FormArray;
    }

    ngOnInit() {
        this.initForm();
        this.targetId = this.route.snapshot.paramMap.get('id');
        if (this.targetId) {
            this.isEditMode = true;
            this.loadTarget(this.targetId);
        }
    }

    initForm() {
        this.form = this.fb.group({
            name: [
                '',
                [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(100),
                ],
            ],
            url: [
                '',
                [Validators.required, Validators.pattern(/https?:\/\/.+/)],
            ],
            method: ['POST', [Validators.required]],
            description: ['', [Validators.maxLength(500)]],
            enabled: [true],
            config: this.fb.group({
                timeout: [
                    5000,
                    [
                        Validators.required,
                        Validators.min(100),
                        Validators.max(60000),
                    ],
                ],
                retryCount: [
                    3,
                    [
                        Validators.required,
                        Validators.min(0),
                        Validators.max(10),
                    ],
                ],
                rateLimit: [null],
            }),
            customHeaders: this.fb.array([]),
        });
    }

    addHeader(key: string = '', value: string = '') {
        this.customHeaders.push(
            this.fb.group({
                key: [key, Validators.required],
                value: [value, Validators.required],
            }),
        );
    }

    removeHeader(index: number) {
        this.customHeaders.removeAt(index);
    }

    loadTarget(id: string) {
        this.loading = true;
        this.targetService
            .getOne(id)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (response) => {
                    this.patchForm(response.data);
                },
                error: (err) => {
                    console.error(err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load target',
                    });
                    this.router.navigate(['/events/dispatch/targets']);
                },
            });
    }

    patchForm(target: ITarget) {
        this.form.patchValue({
            name: target.name,
            url: target.url,
            method: target.method,
            description: target.description,
            enabled: target.enabled,
            config: target.config,
        });

        if (target.customHeaders) {
            Object.entries(target.customHeaders).forEach(([key, value]) => {
                this.addHeader(key, value);
            });
        }
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const formValue = this.form.value;

        // Transform customHeaders from array to object
        const headersObject: Record<string, string> = {};
        formValue.customHeaders.forEach((h: { key: string; value: string }) => {
            headersObject[h.key] = h.value;
        });

        const payload: Partial<ITarget> = {
            ...formValue,
            customHeaders: headersObject,
        };

        const request$ = this.isEditMode
            ? this.targetService.update(this.targetId!, payload)
            : this.targetService.create(payload);

        request$.pipe(finalize(() => (this.loading = false))).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Target ${
                        this.isEditMode ? 'updated' : 'created'
                    } successfully`,
                });
                this.posthog.capture(
                    this.isEditMode ? 'target_updated' : 'target_created',
                    {
                        target_id: this.targetId,
                        context: 'form',
                    },
                );
                setTimeout(() => {
                    this.router.navigate(['/events/dispatch/targets']);
                }, 1000);
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Failed to ${this.isEditMode ? 'update' : 'create'} target`,
                });
            },
        });
    }
}
