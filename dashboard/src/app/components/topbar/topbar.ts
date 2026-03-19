import {
    Component,
    computed,
    inject,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    HostListener,
    signal,
    DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    NavigationEnd,
    Router,
    RouterLink,
} from '@angular/router';
import {
    filter,
    map,
    take,
    switchMap,
    tap,
    startWith,
    catchError,
} from 'rxjs/operators';
import { merge, Subject, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppConfig } from '@components/app.config';
import { LayoutService } from '../service/layout.service';
import { dropdownAnimation } from '@shared/animations/dropdown.animation';
import { DialogService } from '@shared/services/dialog.service';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { StyleClassModule } from 'primeng/styleclass';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';
import { Popover, PopoverModule } from 'primeng/popover';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { INamespace, GetNamespacesResponse } from '@models/namespace.types';
import { ApiResponse } from '@models/index';
import { StorageService } from '@core/services/storage.service';
import { NamespaceService } from '@core/services/namespace.service';
import { AuthService } from '@core/auth/auth.service';
import { WorkerComponent } from '../worker/worker';
import { WorkerService } from '@core/services/worker.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        ButtonModule,
        DialogModule,
        StyleClassModule,
        AppConfig,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        CardModule,
        MenuModule,
        PopoverModule,
        AvatarModule,
        BadgeModule,
        WorkerComponent,
    ],
    templateUrl: './topbar.html',
    styleUrl: './topbar.scss',
    animations: [dropdownAnimation],
})
export class TopbarComponent implements OnInit, OnDestroy {
    private as = inject(AuthService);
    private ss = inject(StorageService);
    private ps = inject(NamespaceService);
    private dialogService = inject(DialogService);
    protected workerService = inject(WorkerService);
    private destroyRef = inject(DestroyRef);

    layoutService: LayoutService = inject(LayoutService);

    workerDrawerVisible = signal(false);

    value1: string = '';
    pageTitle = '';
    searchVisible: boolean = false;
    avatar: string | null;

    isDarkMode = computed(() => this.layoutService.appState().darkMode);
    isOpenSidebar = computed(() => this.layoutService.appState().openSidebar);

    selectedNamespace: INamespace | null = null;
    namespaces: INamespace[] = [];
    loadingNamespaces: boolean = false;
    showFirstNamespaceDialog: boolean = false;
    firstNamespaceDialogVisible: boolean = false;
    showConfig = false;

    @ViewChild(AppConfig, { read: ElementRef }) configPanel!: ElementRef;
    @ViewChild('settingsButton', { read: ElementRef })
    settingsButton!: ElementRef;

    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event) {
        if (
            this.showConfig &&
            this.configPanel &&
            this.settingsButton &&
            !this.configPanel.nativeElement.contains(event.target) &&
            !this.settingsButton.nativeElement.contains(event.target)
        ) {
            this.showConfig = false;
        }
    }

    // Get current workspace ID for dialog
    get currentWorkspaceId(): string | undefined {
        return this.ss.getItem<string>('workspace') || undefined;
    }

    @ViewChild('pp') pp!: Popover;
    @ViewChild('op') op!: Popover;

    private refreshNamespaces$ = new Subject<void>();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private store: StorageService,
    ) {}

    showCreateNamespace() {
        this.dialogService.openNamespaceDialog();
    }

    toggleNamespaceSelector(event: any) {
        this.pp.toggle(event);
    }

    ngOnInit() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                tap(() => {
                    // Close all popovers and UI state on navigation
                    if (this.pp) this.pp.hide();
                    if (this.op) this.op.hide();
                    this.showConfig = false;
                    this.workerDrawerVisible.set(false);
                }),
                map(() => this.getRouteTitle(this.route)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((title) => (this.pageTitle = title || 'Dashboard'));

        // Initialize avatar
        this.avatar = this.ss.getItem('avatar');

        // Initialize worker loading
        this.workerService.acquireWorkerPolling();

        // Unified trigger for namespace loading
        merge(
            this.store.changes$.pipe(
                filter((c) => c?.key === 'workspace' || c?.key === 'avatar'),
                tap((c) => {
                    if (c?.key === 'workspace') {
                        this.selectedNamespace = null;
                        this.ss.removeItem('namespace');
                    } else {
                        this.avatar = this.ss.getItem('avatar');
                    }
                }),
            ),
            this.ps.namespacesUpdated$,
            this.dialogService.namespaceSaved$,
            this.refreshNamespaces$,
        )
            .pipe(
                startWith(null),
                filter(() => !!this.ss.getItem('workspace')),
                tap(() => (this.loadingNamespaces = true)),
                switchMap(() =>
                    this.ps.getWorkspaceNamespaces().pipe(
                        catchError((error: any) => {
                            console.error('Failed to load namespaces:', error);
                            return of({ success: false, data: [] } as any);
                        }),
                    ),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((response: any) => {
                if (response && response.success && response.data) {
                    this.handleNamespaceResponse(response.data);
                }
                this.loadingNamespaces = false;
            });
    }

    ngOnDestroy() {
        this.workerService.releaseWorkerPolling();
    }
    selectNamespace(namespace: INamespace) {
        this.selectedNamespace = namespace;
        this.ss.setItem('namespace', namespace.id);
        // Close the popover after selection
        this.pp.hide();
    }

    loadNamespaces() {
        this.refreshNamespaces$.next();
    }

    private handleNamespaceResponse(namespaces: INamespace[]) {
        this.namespaces = namespaces;

        // Try to restore previously selected namespace
        const namespaceId = this.ss.getItem<string>('namespace');
        if (namespaceId) {
            const savedNamespace = this.namespaces.find(
                (p) => p.id === namespaceId,
            );
            if (savedNamespace) {
                this.selectedNamespace = savedNamespace;
            } else {
                // Invalidate stale selection
                this.ss.removeItem('namespace');
                this.selectedNamespace = null;
            }
        }

        // Select first namespace by default if available and none selected
        if (this.namespaces.length > 0 && !this.selectedNamespace) {
            this.selectedNamespace = this.namespaces[0];
            this.ss.setItem('namespace', this.selectedNamespace.id);
        }

        // Only redirect to Launchpad if no namespaces exist AND we are not in a settings page
        if (
            this.namespaces.length === 0 &&
            !this.router.url.includes('/settings')
        ) {
            this.router.navigate(['/launchpad']);
        }
    }

    private initializeNamespaceSelection() {
        // Handled by reactive stream in ngOnInit
    }

    // First namespace dialog event handlers
    onFirstNamespaceCreated(namespace: INamespace) {
        console.log('First namespace created:', namespace.name);
        this.selectedNamespace = namespace;
        this.namespaces.push(namespace);
        this.firstNamespaceDialogVisible = false;
    }

    onFirstNamespaceDialogVisibleChange(visible: boolean) {
        this.firstNamespaceDialogVisible = visible;
    }

    onFirstNamespaceSkipped() {
        console.log('First namespace dialog skipped');
        this.firstNamespaceDialogVisible = false;
    }

    private getRouteTitle(route: ActivatedRoute): string | undefined {
        while (route.firstChild) route = route.firstChild;
        return route.snapshot.data['title'];
    }

    toggleDarkMode() {
        this.layoutService.appState.update((state) => ({
            ...state,
            darkMode: !state.darkMode,
        }));
    }

    toggleConfig() {
        this.showConfig = !this.showConfig;
    }
    openSidebar() {
        this.layoutService.appState.update((state) => ({
            ...state,
            openSidebar: !state.openSidebar,
        }));
    }
    showSearch() {
        this.searchVisible = true;
    }

    logout() {
        this.as.logout();
        this.router.navigate(['/auth/login']);
    }
}
