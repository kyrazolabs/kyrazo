import {
    Component,
    OnInit,
    inject,
    ChangeDetectorRef,
    ViewChild,
    AfterViewInit,
    DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { TwofaSetupDialogComponent } from '@shared/components/twofa-setup-dialog/twofa-setup-dialog.component';
import { InviteMemberFormComponent } from '@shared/components/invite-member-form/invite-member-form.component';
import { NamespaceFormComponent } from '@shared/components/namespace-form/namespace-form.component';
import { SupportDialogComponent } from '@shared/components/support-dialog/support-dialog.component';
import { AvatarSelectionDialogComponent } from '@shared/components/avatar-selection-dialog/avatar-selection-dialog.component';
import { TransformFormComponent } from '../transforms/components/transform-form/transform-form.component';
import { S3CreateDialogComponent } from '../events/ingest/sources/components/s3-create-dialog/s3-create-dialog.component';
import { ASQSCreateDialogComponent } from '../events/ingest/sources/components/asqs-create-dialog/asqs-create-dialog.component';

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
        TwofaSetupDialogComponent,
        InviteMemberFormComponent,
        NamespaceFormComponent,
        SupportDialogComponent,
        AvatarSelectionDialogComponent,
        TransformFormComponent,
        S3CreateDialogComponent,
        ASQSCreateDialogComponent,
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
    private destroyRef = inject(DestroyRef);

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

    // Invite Member Dialog
    inviteMemberDialogVisible = false;
    inviteMemberWorkspaceId: string | null = null;

    // Namespace Dialog
    namespaceDialogVisible = false;
    namespaceDialogId: string | null = null;
    namespaceDialogHeader = 'Create Namespace';

    // Support Dialog
    supportDialogVisible = false;

    // Transform Dialog
    transformDialogVisible = false;
    transformDialogId: string | null = null;
    transformDialogHeader = 'Create Transform';

    // Avatar Dialog
    avatarDialogVisible = false;
    currentAvatar: string | null = null;

    constructor(private dialogService: DialogService) {}

    childRoute(outlet: RouterOutlet) {
        return outlet?.activatedRouteData?.['animation'];
    }
    ngOnInit() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this.footerAnimationKey = this.router.url;
            });

        this.dialogService.message$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((msg: DialogMessage | null) => {
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
        this.dialogService.sourceDialogState$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.sourceDialogVisible = state.visible;
                this.sourceDialogId = state.sourceId;
                this.sourceDialogHeader = state.sourceId
                    ? 'Edit Source'
                    : 'Create Source';
            });

        // Listen for Endpoint Dialog State
        this.dialogService.endpointDialogState$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.endpointDialogVisible = state.visible;
                this.endpointDialogId = state.endpointId;
                this.endpointDialogHeader = state.endpointId
                    ? 'Edit Endpoint'
                    : 'Create Endpoint';
            });

        // Listen for Target Dialog State
        this.dialogService.targetDialogState$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.targetDialogVisible = state.visible;
                this.targetDialogId = state.targetId;
                this.targetDialogHeader = state.targetId
                    ? 'Edit Target'
                    : 'Create Target';
            });

        // Listen for Invite Member Dialog State
        this.dialogService.inviteMemberDialogState$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.inviteMemberDialogVisible = state.visible;
                this.inviteMemberWorkspaceId = state.workspaceId;
            });

        // Listen for Namespace Dialog State
        this.dialogService.namespaceDialogState$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.namespaceDialogVisible = state.visible;
                this.namespaceDialogId = state.namespaceId;
                this.namespaceDialogHeader = state.namespaceId
                    ? 'Edit Namespace'
                    : 'Create Namespace';
            });

        // Listen for Support Dialog State
        this.dialogService.supportDialogState$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.supportDialogVisible = state.visible;
            });

        // Listen for Transform Dialog State
        this.dialogService.transformDialogState$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.transformDialogVisible = state.visible;
                this.transformDialogId = state.transformId;
                this.transformDialogHeader = state.transformId
                    ? 'Edit Transform'
                    : 'Create Transform';
            });

        // Listen for Avatar Dialog State
        this.dialogService.avatarDialogState$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.avatarDialogVisible = state.visible;
                this.currentAvatar = state.currentAvatar;
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

    onInviteMemberSuccess(data?: any) {
        this.dialogService.notifyMemberInvited(data);
        this.dialogService.closeInviteMemberDialog();
    }

    onInviteMemberDialogHide() {
        this.dialogService.closeInviteMemberDialog();
    }

    onNamespaceFormSuccess(data?: any) {
        this.dialogService.notifyNamespaceSaved(data);
        this.dialogService.closeNamespaceDialog();
    }

    onNamespaceDialogHide() {
        this.dialogService.closeNamespaceDialog();
    }

    onSupportDialogHide() {
        this.dialogService.closeSupportDialog();
    }

    onAvatarSelected(avatar: any) {
        console.log('AppShell: avatar selected', avatar, typeof avatar);
        if (typeof avatar === 'string') {
            this.dialogService.notifyAvatarSelected(avatar);
        } else if (avatar && avatar.target && avatar.target.value) {
            this.dialogService.notifyAvatarSelected(avatar.target.value);
        } else {
            console.warn(
                'AppShell: unexpected avatar selection payload',
                avatar,
            );
        }
        this.dialogService.closeAvatarDialog();
    }

    onAvatarDialogHide() {
        this.dialogService.closeAvatarDialog();
    }

    onTransformFormSuccess(data?: any) {
        this.dialogService.notifyTransformSaved(data);
        this.dialogService.closeTransformDialog();
    }

    onTransformDialogHide() {
        this.dialogService.closeTransformDialog();
    }
}
