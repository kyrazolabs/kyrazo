import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ApiResponse, WorkspaceActionResponse } from '@models/index';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { WorkspaceService } from '@core/services/workspace.service';

export interface InvitationDetails {
    workspaceName: string;
    inviterName: string;
    role: string;
}

@Component({
    selector: 'app-invitation',
    standalone: true,
    imports: [
        CommonModule,
        ToastModule,
        ButtonModule,
        CardModule,
        RouterLink,
        ScrollRevealDirective,
    ],
    template: `
        <p-toast />

        <div
            class="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        >
            <!-- Ambient Glow Background -->
            <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-[800px] bg-primary-500/5 blur-[160px] rounded-full pointer-events-none"
            ></div>

            <div class="w-full max-w-lg relative z-10">
                <!-- Header -->
                <div class="text-center mb-12">
                    <h1
                        appScrollReveal
                        delay="delay-100"
                        class="text-4xl md:text-5xl font-black text-surface-900 dark:text-surface-0 mb-4 tracking-tighter"
                    >
                        Team Invitation
                    </h1>
                    <p
                        appScrollReveal
                        delay="delay-150"
                        class="text-surface-600 dark:text-surface-400 text-lg font-medium"
                    >
                        You've been invited to join a collaborative space
                    </p>
                </div>

                <!-- content Card -->
                <div
                    appScrollReveal
                    delay="delay-200"
                    class="bg-surface-0/80 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-2xl p-10 shadow-sm shadow-surface-950/10"
                >
                    @if (loading()) {
                        <div
                            class="flex flex-col items-center justify-center py-12"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                class="text-primary-500"
                            >
                                <g stroke="currentColor" stroke-width="1">
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9.5"
                                        fill="none"
                                        stroke-linecap="round"
                                        stroke-width="2"
                                    >
                                        <animate
                                            attributeName="stroke-dasharray"
                                            calcMode="spline"
                                            dur="0.75s"
                                            keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
                                            keyTimes="0;0.475;0.95;1"
                                            repeatCount="indefinite"
                                            values="0 150;42 150;42 150;42 150"
                                        />
                                        <animate
                                            attributeName="stroke-dashoffset"
                                            calcMode="spline"
                                            dur="0.75s"
                                            keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
                                            keyTimes="0;0.475;0.95;1"
                                            repeatCount="indefinite"
                                            values="0;-16;-59;-59"
                                        />
                                    </circle>
                                    <animateTransform
                                        attributeName="transform"
                                        dur="1s"
                                        repeatCount="indefinite"
                                        type="rotate"
                                        values="0 12 12;360 12 12"
                                    />
                                </g>
                            </svg>
                            <p
                                class="mt-8 text-surface-500 dark:text-surface-400 font-bold text-lg animate-pulse tracking-wide"
                            >
                                LOADING DETAILS...
                            </p>
                        </div>
                    } @else if (success()) {
                        <div class="text-center space-y-10 py-6">
                            <div
                                class="flex items-center justify-center w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-full mx-auto"
                            >
                                <i
                                    class="icon-[hugeicons--checkmark-circle-01] size-16 text-green-500"
                                ></i>
                            </div>
                            <div class="space-y-4">
                                <h2
                                    class="text-4xl font-black text-surface-900 dark:text-surface-0 tracking-tight"
                                >
                                    Welcome to the Workspace!
                                </h2>
                                <p
                                    class="text-xl text-surface-600 dark:text-surface-400"
                                >
                                    You are now a part of
                                    <span
                                        class="text-surface-900 dark:text-surface-0 font-black decoration-green-500 underline decoration-4 underline-offset-4"
                                        >{{ details()?.workspaceName }}</span
                                    >
                                </p>
                            </div>
                            <div class="pt-6">
                                <p-button
                                    label="Enter Dashboard"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    (onClick)="goToDashboard()"
                                    styleClass="w-full rounded-2xl! py-5 text-xl font-black shadow-xl shadow-primary-500/30"
                                />
                            </div>
                        </div>
                    } @else if (details()) {
                        <div class="space-y-12">
                            <div class="text-center space-y-6">
                                <div class="flex flex-col items-center gap-3">
                                    <div
                                        class="flex items-center -space-x-4 mb-2"
                                    >
                                        <div
                                            class="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 border-4 border-white dark:border-surface-900 flex items-center justify-center"
                                        >
                                            <i
                                                class="icon-[hugeicons--user] size-7 text-surface-500"
                                            ></i>
                                        </div>
                                        <div
                                            class="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-500/20 border-4 border-white dark:border-surface-900 flex items-center justify-center rotate-6 transition-transform hover:rotate-0"
                                        >
                                            <i
                                                class="icon-[hugeicons--building-01] size-7 text-primary-500"
                                            ></i>
                                        </div>
                                    </div>
                                    <p
                                        class="text-2xl font-medium text-surface-600 dark:text-surface-300 leading-snug"
                                    >
                                        <span
                                            class="font-black text-surface-900 dark:text-surface-0"
                                            >{{ details()?.inviterName }}</span
                                        ><br />
                                        invited you to join
                                    </p>
                                </div>

                                <div
                                    class="py-12 px-8 bg-surface-50 dark:bg-surface-950/50 rounded-[2.5rem] border-2 border-dashed border-surface-200 dark:border-surface-800 group transition-all duration-300 hover:border-primary-500/50 hover:bg-primary-50/20"
                                >
                                    <h3
                                        class="text-4xl font-black text-surface-900 dark:text-surface-0 tracking-tighter mb-4 transition-transform duration-300 group-hover:scale-105"
                                    >
                                        {{ details()?.workspaceName }}
                                    </h3>
                                    <div
                                        class="inline-flex items-center px-6 py-2.5 rounded-2xl bg-surface-900 dark:bg-primary-500 text-white shadow-xl text-sm font-black uppercase tracking-widest ring-8 ring-primary-500/5"
                                    >
                                        <i
                                            class="icon-[hugeicons--shield-user] mr-2 size-5"
                                        ></i>
                                        {{ details()?.role }}
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col gap-5">
                                <p-button
                                    label="Accept Invitation"
                                    icon="icon-[hugeicons--checkmark-circle-01] size-6 mr-2"
                                    styleClass="w-full py-5 text-xl font-black rounded-2xl! shadow-2xl shadow-primary-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                                    [loading]="actionLoading()"
                                    (onClick)="accept()"
                                />
                                <p-button
                                    label="Decline"
                                    [disabled]="actionLoading()"
                                    (onClick)="reject()"
                                    styleClass="p-button-secondary p-button-text w-full text-surface-400 hover:text-red-500 dark:hover:text-red-400 font-bold transition-colors py-4"
                                />
                            </div>
                        </div>
                    } @else if (error()) {
                        <div class="text-center py-8">
                            <div
                                class="inline-flex items-center justify-center w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-3xl mb-10 shadow-inner"
                            >
                                <i
                                    class="icon-[hugeicons--alert-01] size-12 text-red-500"
                                ></i>
                            </div>
                            <h3
                                class="text-3xl font-black text-surface-900 dark:text-surface-0 mb-4 tracking-tight"
                            >
                                Invalid Connection
                            </h3>
                            <p
                                class="text-surface-600 dark:text-surface-400 mb-12 max-w-xs mx-auto text-xl leading-relaxed"
                            >
                                {{ error() }}
                            </p>
                            <p-button
                                label="Go The dashboard"
                                [severity]="'primary'"
                                styleClass="rounded-2xl! px-5! font-black! text-lg!"
                                routerLink="/"
                            />
                        </div>
                    }
                </div>
            </div>

            <!-- Confetti Particles -->
            <div class="confetti-container">
                @for (p of confettiParticles(); track p.id) {
                    <div
                        class="confetti"
                        [style.left]="p.left"
                        [style.background-color]="p.color"
                        [style.animation-delay]="p.delay"
                        [style.width]="p.size"
                        [style.height]="p.size"
                        [style.--x]="p.x"
                        [style.--y]="p.y"
                        [style.--rotation]="p.rotation"
                    ></div>
                }
            </div>
        </div>
    `,
    styleUrl: './invitation.page.scss',
    providers: [MessageService],
})
export class InvitationPage implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private workspaceService = inject(WorkspaceService);
    private messageService = inject(MessageService);

    token: string | null = null;
    loading = signal(true);
    actionLoading = signal(false);
    success = signal(false);
    details = signal<InvitationDetails | null>(null);
    error = signal<string | null>(null);
    confettiParticles = signal<any[]>([]);

    ngOnInit(): void {
        this.token = this.route.snapshot.paramMap.get('token');

        if (this.token) {
            this.fetchDetails();
        } else {
            this.error.set('No invitation token found.');
            this.loading.set(false);
        }
    }

    fetchDetails() {
        this.workspaceService.getInvitationDetails(this.token!).subscribe({
            next: (res: ApiResponse<InvitationDetails>) => {
                if (res.success) {
                    this.details.set(res.data);
                } else {
                    this.error.set(
                        res.error ||
                            'This invitation link has expired or is invalid.',
                    );
                }
                this.loading.set(false);
            },
            error: (err: any) => {
                this.error.set(
                    err.error?.error?.message ||
                        'Invalid or expired invitation.',
                );
                this.loading.set(false);
            },
        });
    }

    accept(): void {
        this.actionLoading.set(true);
        this.workspaceService.acceptInvitation(this.token!).subscribe({
            next: (res: WorkspaceActionResponse) => {
                if (res.success) {
                    this.success.set(true);
                    this.triggerConfetti();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message || 'Failed to accept invitation.',
                    });
                }
                this.actionLoading.set(false);
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail:
                        err.error?.error?.message || 'Something went wrong.',
                });
                this.actionLoading.set(false);
            },
        });
    }

    reject(): void {
        this.actionLoading.set(true);
        this.workspaceService.rejectInvitation(this.token!).subscribe({
            next: (res: WorkspaceActionResponse) => {
                if (res.success) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Declined',
                        detail: 'Invitation declined successfully.',
                    });
                    setTimeout(
                        () => this.router.navigate(['/auth/login']),
                        1500,
                    );
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message || 'Failed to decline invitation.',
                    });
                }
                this.actionLoading.set(false);
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail:
                        err.error?.error?.message || 'Something went wrong.',
                });
                this.actionLoading.set(false);
            },
        });
    }

    triggerConfetti() {
        const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];
        const particles = [];
        const count = 200;

        for (let i = 0; i < count; i++) {
            const isLeft = i < count / 2;
            const angle = isLeft
                ? Math.random() * 60 + 20
                : Math.random() * 60 + 100;
            const velocity = Math.random() * 700 + 500;
            const rad = (angle * Math.PI) / 180;

            particles.push({
                id: i,
                left: isLeft ? '-5vw' : '105vw',
                color: colors[Math.floor(Math.random() * colors.length)],
                x: Math.cos(rad) * velocity + 'px',
                y: -Math.sin(rad) * velocity + 'px',
                rotation: Math.random() * 720 - 360 + 'deg',
                delay: Math.random() * 0.8 + 's',
                size: Math.random() * 10 + 5 + 'px',
            });
        }
        this.confettiParticles.set(particles);
    }

    goToDashboard() {
        this.router.navigate(['/']);
    }
}
