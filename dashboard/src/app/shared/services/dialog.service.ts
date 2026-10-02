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

    // Transform Dialog State
    private transformDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        transformId: string | null;
    }>({ visible: false, transformId: null });
    transformDialogState$ = this.transformDialogStateSubject.asObservable();

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

    // Support Dialog State
    private supportDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
    }>({ visible: false });
    supportDialogState$ = this.supportDialogStateSubject.asObservable();

    // Avatar Selection Dialog State
    private avatarDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        currentAvatar: string | null;
    }>({ visible: false, currentAvatar: null });
    avatarDialogState$ = this.avatarDialogStateSubject.asObservable();

    // S3 Dialog State
    private s3DialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        s3Id: string | null;
    }>({ visible: false, s3Id: null });
    s3DialogState$ = this.s3DialogStateSubject.asObservable();

    // ASQS Dialog State
    private asqsDialogStateSubject = new BehaviorSubject<{
        visible: boolean;
        asqsId: string | null;
    }>({ visible: false, asqsId: null });
    asqsDialogState$ = this.asqsDialogStateSubject.asObservable();


    // Event Sources
    private sourceSavedSource = new Subject<any>();
    sourceSaved$ = this.sourceSavedSource.asObservable();

    private endpointSavedSource = new Subject<any>();
    endpointSaved$ = this.endpointSavedSource.asObservable();

    private targetSavedSource = new Subject<any>();
    targetSaved$ = this.targetSavedSource.asObservable();

    private transformSavedSource = new Subject<any>();
    transformSaved$ = this.transformSavedSource.asObservable();

    private twofaEnabledSource = new Subject<void>();
    twofaEnabled$ = this.twofaEnabledSource.asObservable();

    private memberInvitedSource = new Subject<any>();
    memberInvited$ = this.memberInvitedSource.asObservable();

    private namespaceSavedSource = new Subject<any>();
    namespaceSaved$ = this.namespaceSavedSource.asObservable();

    private avatarSelectedSource = new Subject<string>();
    avatarSelected$ = this.avatarSelectedSource.asObservable();

    private s3SavedSource = new Subject<any>();
    s3Saved$ = this.s3SavedSource.asObservable();

    private asqsSavedSource = new Subject<any>();
    asqsSaved$ = this.asqsSavedSource.asObservable();


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

    // Transform Dialog Methods
    openTransformDialog(transformId: string | null = null) {
        this.transformDialogStateSubject.next({ visible: true, transformId });
    }

    closeTransformDialog() {
        this.transformDialogStateSubject.next({
            visible: false,
            transformId: null,
        });
    }

    notifyTransformSaved(data?: any) {
        this.transformSavedSource.next(data);
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

    // Support Dialog Methods
    openSupportDialog() {
        this.supportDialogStateSubject.next({ visible: true });
    }

    closeSupportDialog() {
        this.supportDialogStateSubject.next({ visible: false });
    }

    // Avatar Selection Dialog Methods
    openAvatarDialog(currentAvatar: string | null = null) {
        this.avatarDialogStateSubject.next({ visible: true, currentAvatar });
    }

    closeAvatarDialog() {
        this.avatarDialogStateSubject.next({
            visible: false,
            currentAvatar: null,
        });
    }

    notifyAvatarSelected(avatar: string) {
        this.avatarSelectedSource.next(avatar);
    }

    // S3 Dialog Methods
    openS3Dialog(s3Id: string | null = null) {
        this.s3DialogStateSubject.next({ visible: true, s3Id });
    }

    closeS3Dialog() {
        this.s3DialogStateSubject.next({ visible: false, s3Id: null });
    }

    notifyS3Saved(data?: any) {
        this.s3SavedSource.next(data);
    }

    // ASQS Dialog Methods
    openASQSDialog(asqsId: string | null = null) {
        this.asqsDialogStateSubject.next({ visible: true, asqsId });
    }

    closeASQSDialog() {
        this.asqsDialogStateSubject.next({ visible: false, asqsId: null });
    }

    notifyASQSSaved(data?: any) {
        this.asqsSavedSource.next(data);
    }
}
