import {
    Component,
    OnInit,
    inject,
    ChangeDetectorRef,
    ViewChild,
    AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';

import { TopbarComponent } from '@components/topbar/topbar';
import { SidebarComponent } from '@components/sidebar/sidebar';
import { FooterComponent } from '@components/footer/footer';
import { DialogService, DialogMessage } from '@shared/services/dialog.service';
import { routeTransitionAnimations } from '@shared/animations/route.animation';
import { LayoutService } from '@components/service/layout.service';
import { SourceFormComponent } from '../events/ingest/sources/components/source-form/source-form.component';
import { EndpointFormComponent } from '../events/ingest/endpoints/components/endpoint-form/endpoint-form.component';
import { TargetFormComponent } from '../events/dispatch/targets/components/target-form/target-form.component';

@Component({
    selector: 'app-shell',
    imports: [
        CommonModule,
        TopbarComponent,
        SidebarComponent,
        RouterOutlet,
        ButtonModule,
        DialogModule,
        TooltipModule,
        SourceFormComponent,
        EndpointFormComponent,
        TargetFormComponent,
    ],
    templateUrl: './app-shell.html',
    styleUrl: './app-shell.scss',
    animations: [routeTransitionAnimations],
})
export class AppShell implements OnInit, AfterViewInit {
    @ViewChild('outlet', { static: true }) outlet!: RouterOutlet;

    animationState: string = '';
    footerAnimationKey: string = '';

    private mes = inject(MessageService);
    private cdr = inject(ChangeDetectorRef);
    private router = inject(Router);
    public layoutService = inject(LayoutService);

    secretV = false;
    ingressV = false;

    secret = {
        key: '',
        masked: true,
        get maskedKey() {
            return '*'.repeat(this.key.length);
        },
    };

    ingress = {
        url: '',
    };

    // Source Dialog
    sourceDialogVisible = false;
    sourceDialogId: string | null = null;
    sourceDialogHeader = 'Create Source';

    // Endpoint Dialog
    endpointDialogVisible = false;
    endpointDialogId: string | null = null;
    endpointDialogHeader = 'Create Endpoint';

    // Target Dialog
    targetDialogVisible = false;
    targetDialogId: string | null = null;
    targetDialogHeader = 'Create Target';

    constructor(private dialogService: DialogService) {}

    childRoute(outlet: RouterOutlet) {
        return outlet?.activatedRouteData?.['animation'];
    }
    ngOnInit() {
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => {
                this.footerAnimationKey = this.router.url;
            });

        this.dialogService.message$.subscribe((msg: DialogMessage | null) => {
            if (!msg) return;

            switch (msg.type) {
                case 'secret':
                    this.secret.key = msg.data.key;
                    this.secret.masked = false;
                    this.secretV = true;
                    break;

                case 'ingress':
                    this.ingress.url = msg.data.ingress;
                    this.ingressV = true;
                    break;
            }
        });

        // Listen for Source Dialog State
        this.dialogService.sourceDialogState$.subscribe((state) => {
            this.sourceDialogVisible = state.visible;
            this.sourceDialogId = state.sourceId;
            this.sourceDialogHeader = state.sourceId
                ? 'Edit Source'
                : 'Create Source';
        });

        // Listen for Endpoint Dialog State
        this.dialogService.endpointDialogState$.subscribe((state) => {
            this.endpointDialogVisible = state.visible;
            this.endpointDialogId = state.endpointId;
            this.endpointDialogHeader = state.endpointId
                ? 'Edit Endpoint'
                : 'Create Endpoint';
        });

        // Listen for Target Dialog State
        this.dialogService.targetDialogState$.subscribe((state) => {
            this.targetDialogVisible = state.visible;
            this.targetDialogId = state.targetId;
            this.targetDialogHeader = state.targetId
                ? 'Edit Target'
                : 'Create Target';
        });
    }

    ngAfterViewInit() {
        this.updateAnimationState();
    }

    private updateAnimationState() {
        this.animationState = this.outlet?.isActivated
            ? this.outlet.activatedRoute.snapshot.data['animation']
            : '';
        this.cdr.detectChanges();
    }

    toggleKeyVisibility() {
        this.secret.masked = !this.secret.masked;
    }

    async copyToClipboard(value: string) {
        try {
            await navigator.clipboard.writeText(value);
            this.mes.add({
                severity: 'success',
                summary: 'Copied to clipboard',
                life: 2000,
            });
            this.secretV = false;
            this.ingressV = false;
        } catch {
            this.mes.add({
                severity: 'error',
                summary: 'Failed to copy',
                life: 2000,
            });
        }
    }

    onClose(type: 'secret' | 'ingress') {
        if (type === 'secret') this.secretV = false;
        if (type === 'ingress') this.ingressV = false;
        this.dialogService.clear();
    }

    onSourceFormSuccess(data?: any) {
        this.dialogService.notifySourceSaved(data);
        this.dialogService.closeSourceDialog();
    }

    onSourceDialogHide() {
        this.dialogService.closeSourceDialog();
    }

    onEndpointFormSuccess(data?: any) {
        this.dialogService.notifyEndpointSaved(data);
        this.dialogService.closeEndpointDialog();
    }

    onEndpointDialogHide() {
        this.dialogService.closeEndpointDialog();
    }

    onTargetFormSuccess(data?: any) {
        this.dialogService.notifyTargetSaved(data);
        this.dialogService.closeTargetDialog();
    }

    onTargetDialogHide() {
        this.dialogService.closeTargetDialog();
    }
}
