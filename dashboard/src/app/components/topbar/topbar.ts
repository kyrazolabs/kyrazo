import {
    Component,
    computed,
    inject,
    OnInit,
    ViewChild,
    ElementRef,
    HostListener,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    NavigationEnd,
    Router,
    RouterLink,
} from '@angular/router';
import { filter, map } from 'rxjs/operators';

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
import { INamespace } from '@models/namespace.types';
import { StorageService } from '@core/services/storage.service';
import { NamespaceService } from '@core/services/namespace.service';
import { CreateFirstNamespaceComponent } from '../launchpad/namespaces/create-first-namespace/create-first-namespace';
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
export class TopbarComponent implements OnInit {
    private as = inject(AuthService);
    private ss = inject(StorageService);
    private ps = inject(NamespaceService);
    private dialogService = inject(DialogService);
    protected workerService = inject(WorkerService);

    layoutService: LayoutService = inject(LayoutService);

    visible: boolean = false;
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

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private store: StorageService,
    ) {
        this.store.changes$.subscribe((change) => {
            if (change?.key === 'workspace') {
                this.selectedNamespace = null;
                this.ss.removeItem('namespace');
                this.loadNamespaces();
            }
            if (change?.key === 'avatar') {
                this.avatar = this.ss.getItem('avatar');
                this.loadNamespaces();
            }
        });
    }

    showCreateNamespace() {
        this.visible = true;
    }

    toggleNamespaceSelector(event: any) {
        this.pp.toggle(event);
    }

    ngOnInit() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                map(() => this.getRouteTitle(this.route)),
            )
            .subscribe((title) => (this.pageTitle = title || 'Dashboard'));

        // Initialize avatar
        this.avatar = this.ss.getItem('avatar');

        // Initialize namespace selection on load
        this.initializeNamespaceSelection();

        // Initialize worker loading
        this.workerService.loadWorkers();

        // Listen for namespace updates
        this.ps.namespacesUpdated$.subscribe(() => {
            this.loadNamespaces();
        });
    }
    selectNamespace(namespace: INamespace) {
        this.selectedNamespace = namespace;
        this.ss.setItem('namespace', namespace.id);
        // Close the popover after selection
        this.pp.hide();
    }

    loadNamespaces() {
        this.loadingNamespaces = true;
        this.ps.getWorkspaceNamespaces().subscribe({
            next: (response) => {
                this.namespaces = response.data;
                // Try to restore previously selected namespace
                const namespaceId = this.ss.getItem<string>('namespace');
                if (namespaceId) {
                    const savedNamespace = this.namespaces.find(
                        (p) => p.id === namespaceId,
                    );
                    if (savedNamespace) {
                        this.selectedNamespace = savedNamespace;
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

                this.loadingNamespaces = false;
            },
            error: (error) => {
                console.error('Failed to load namespaces:', error);
                this.loadingNamespaces = false;
            },
        });
    }

    private initializeNamespaceSelection() {
        // Check if workspace exists and load namespaces
        const workspaceId = this.ss.getItem<string>('workspace');
        if (workspaceId) {
            this.loadNamespaces();
        }
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
