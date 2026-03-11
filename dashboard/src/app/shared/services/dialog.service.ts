import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

export interface DialogMessage {
    type: string;
    data: any;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
    private messageSubject = new BehaviorSubject<DialogMessage | null>(null);
    message$ = this.messageSubject.asObservable();

    // Source Dialog State
    private sourceDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        sourceId: string | null;
    }>({ visible: false, sourceId: null });
    sourceDialogState$ = this.sourceDialogStateSubject.asObservable();

    // Endpoint Dialog State
    private endpointDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        endpointId: string | null;
    }>({ visible: false, endpointId: null });
    endpointDialogState$ = this.endpointDialogStateSubject.asObservable();

    // Target Dialog State
    private targetDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        targetId: string | null;
    }>({ visible: false, targetId: null });
    targetDialogState$ = this.targetDialogStateSubject.asObservable();

    // Billing Dialog State
    private billingDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
    }>({ visible: false });
    billingDialogState$ = this.billingDialogStateSubject.asObservable();

    // 2FA Setup Dialog State
    private twofaSetupDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
    }>({ visible: false });
    twofaSetupDialogState$ = this.twofaSetupDialogStateSubject.asObservable();

    // Invite Member Dialog State
    private inviteMemberDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        workspaceId: string | null;
    }>({ visible: false, workspaceId: null });
    inviteMemberDialogState$ =
        this.inviteMemberDialogStateSubject.asObservable();

    // Namespace Dialog State
    private namespaceDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        namespaceId: string | null;
    }>({ visible: false, namespaceId: null });
    namespaceDialogState$ = this.namespaceDialogStateSubject.asObservable();

    // Event Sources
    private sourceSavedSource = new Subject<any>();
    sourceSaved$ = this.sourceSavedSource.asObservable();

    private endpointSavedSource = new Subject<any>();
    endpointSaved$ = this.endpointSavedSource.asObservable();

    private targetSavedSource = new Subject<any>();
    targetSaved$ = this.targetSavedSource.asObservable();

    private twofaEnabledSource = new Subject<void>();
    twofaEnabled$ = this.twofaEnabledSource.asObservable();

    private memberInvitedSource = new Subject<any>();
    memberInvited$ = this.memberInvitedSource.asObservable();

    private namespaceSavedSource = new Subject<any>();
    namespaceSaved$ = this.namespaceSavedSource.asObservable();

    private router = inject(Router);

    constructor() {}

    // Methods
    showMessage(type: 'secret' | 'ingress', data: any) {
        this.messageSubject.next({ type, data });
    }

    clear() {
        this.messageSubject.next(null);
    }

    // Source Dialog Methods
    openSourceDialog(sourceId: string | null = null) {
        this.sourceDialogStateSubject.next({ visible: true, sourceId });
    }

    closeSourceDialog() {
        this.sourceDialogStateSubject.next({ visible: false, sourceId: null });
    }

    notifySourceSaved(data?: any) {
        this.sourceSavedSource.next(data);
    }

    // Endpoint Dialog Methods
    openEndpointDialog(endpointId: string | null = null) {
        this.endpointDialogStateSubject.next({ visible: true, endpointId });
    }

    closeEndpointDialog() {
        this.endpointDialogStateSubject.next({
            visible: false,
            endpointId: null,
        });
    }

    notifyEndpointSaved(data?: any) {
        this.endpointSavedSource.next(data);
    }

    // Target Dialog Methods
    openTargetDialog(targetId: string | null = null) {
        this.targetDialogStateSubject.next({ visible: true, targetId });
    }

    closeTargetDialog() {
        this.targetDialogStateSubject.next({ visible: false, targetId: null });
    }

    notifyTargetSaved(data?: any) {
        this.targetSavedSource.next(data);
    }

    // Billing Dialog Methods
    openBillingDialog() {
        this.router.navigate(['/settings'], {
            queryParams: { tab: 'billing' },
        });
        this.billingDialogStateSubject.next({ visible: true });
    }

    closeBillingDialog() {
        this.billingDialogStateSubject.next({ visible: false });
    }

    // 2FA Setup Dialog Methods
    openTwofaSetupDialog() {
        this.twofaSetupDialogStateSubject.next({ visible: true });
    }

    closeTwofaSetupDialog() {
        this.twofaSetupDialogStateSubject.next({ visible: false });
    }

    notifyTwofaEnabled() {
        this.twofaEnabledSource.next();
    }

    // Invite Member Dialog Methods
    openInviteMemberDialog(workspaceId: string | null = null) {
        this.inviteMemberDialogStateSubject.next({
            visible: true,
            workspaceId,
        });
    }

    closeInviteMemberDialog() {
        this.inviteMemberDialogStateSubject.next({
            visible: false,
            workspaceId: null,
        });
    }

    notifyMemberInvited(data?: any) {
        this.memberInvitedSource.next(data);
    }

    // Namespace Dialog Methods
    openNamespaceDialog(namespaceId: string | null = null) {
        this.namespaceDialogStateSubject.next({ visible: true, namespaceId });
    }

    closeNamespaceDialog() {
        this.namespaceDialogStateSubject.next({
            visible: false,
            namespaceId: null,
        });
    }

    notifyNamespaceSaved(data?: any) {
        this.namespaceSavedSource.next(data);
    }
}
