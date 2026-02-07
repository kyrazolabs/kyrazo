import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreateFirstWorkspace } from '@components/launchpad/workspaces/create-first-workspace/create-first-workspace';
import { CreateFirstProjectComponent } from '@components/launchpad/projects/create-first-project/create-first-project';
import { StorageService } from '@core/services/storage.service';
import { ButtonModule } from 'primeng/button';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-launchpad',
    standalone: true,
    imports: [
        CommonModule,
        CreateFirstWorkspace,
        CreateFirstProjectComponent,
        ButtonModule,
        ScrollRevealDirective,
    ],
    templateUrl: './launchpad.page.html',
    styleUrl: './launchpad.page.scss',
})
export class LaunchpadPage {
    private router = inject(Router);
    private storage = inject(StorageService);

    currentStep = signal(1); // 1: Workspace, 2: Project, 3: Success
    createdWorkspaceId = signal<string | null>(null);
    confettiParticles = signal<any[]>([]);

    onWorkspaceCreated(workspace: any) {
        this.createdWorkspaceId.set(workspace._id);
        this.storage.setItem('workspace', workspace._id);
        this.currentStep.set(2);
    }

    onProjectCreated(project: any) {
        this.storage.setItem('project', project.id);
        this.currentStep.set(3);
        this.triggerConfetti();
    }

    triggerConfetti() {
        const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];
        const particles = [];
        const count = 250; // Increased density

        for (let i = 0; i < count; i++) {
            const isLeft = i < count / 2;
            const angle = isLeft
                ? Math.random() * 60 + 20
                : Math.random() * 60 + 100;
            const velocity = Math.random() * 600 + 400;
            const rad = (angle * Math.PI) / 180;

            particles.push({
                id: i,
                left: isLeft ? '-5vw' : '105vw',
                color: colors[Math.floor(Math.random() * colors.length)],
                x: Math.cos(rad) * velocity + 'px',
                y: -Math.sin(rad) * velocity + 'px',
                rotation: Math.random() * 720 - 360 + 'deg',
                delay: Math.random() * 0.5 + 's',
                size: Math.random() * 8 + 4 + 'px',
            });
        }
        this.confettiParticles.set(particles);
    }

    goToDashboard() {
        this.router.navigate(['/']);
    }
}
