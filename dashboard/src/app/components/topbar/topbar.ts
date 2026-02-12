import {
    Component,
    computed,
    inject,
    OnInit,
    ViewChild,
    ElementRef,
    HostListener,
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
import { IProject } from '@models/project.types';
import { StorageService } from '@core/services/storage.service';
import { ProjectService } from '@core/services/project.service';
import { CreateFirstProjectComponent } from '../launchpad/projects/create-first-project/create-first-project';
import { AuthService } from '@core/auth/auth.service';

@Component({
    selector: 'app-topbar',
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
    ],
    templateUrl: './topbar.html',
    styleUrl: './topbar.scss',
    animations: [dropdownAnimation],
})
export class TopbarComponent implements OnInit {
    private as = inject(AuthService);
    private ss = inject(StorageService);
    private ps = inject(ProjectService);
    private dialogService = inject(DialogService);

    layoutService: LayoutService = inject(LayoutService);

    visible: boolean = false;

    value1: string = '';
    pageTitle = '';
    searchVisible: boolean = false;
    avatar: string | null;
    avatarItem = [
        {
            label: 'Settings',
            icon: 'pi pi-cog',
            url: '/settings',
            description: 'System configuration',
            shortcut: '⌘+S',
            items: [
                // Added nested items array
                {
                    label: 'Profile',
                    icon: 'pi pi-user',
                    url: '/settings/profile',
                    description: 'Account information',
                    shortcut: '⌘+P',
                },
                {
                    label: 'Notifications',
                    icon: 'pi pi-bell',
                    url: '/settings/notifications',
                    description: 'Alert preferences',
                    badge: '3',
                    badgeType: 'info',
                    shortcut: '⌘+N',
                },
                {
                    label: 'Billing',
                    icon: 'pi pi-credit-card',
                    command: () => this.openBilling(),
                    description: 'Subscription & payments',
                    status: 'active',
                    shortcut: '⌘+B',
                },
            ],
        },
    ];

    isDarkMode = computed(() => this.layoutService.appState().darkMode);
    isOpenSidebar = computed(() => this.layoutService.appState().openSidebar);

    selectedProject: IProject | null = null;
    projects: IProject[] = [];
    loadingProjects: boolean = false;
    showFirstProjectDialog: boolean = false;
    firstProjectDialogVisible: boolean = false;
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
                this.selectedProject = null;
                this.ss.removeItem('project');
                this.loadProjects();
            }
            if (change?.key === 'avatar') {
                this.avatar = this.ss.getItem('avatar');
                this.loadProjects();
            }
        });
    }

    showCreateProject() {
        this.visible = true;
    }

    toggleProjectSelector(event: any) {
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

        // Initialize project selection on load
        this.initializeProjectSelection();

        // Listen for project updates
        this.ps.projectsUpdated$.subscribe(() => {
            this.loadProjects();
        });
    }
    selectProject(project: IProject) {
        this.selectedProject = project;
        this.ss.setItem('project', project.id);
        // Close the popover after selection
        this.pp.hide();
    }

    loadProjects() {
        this.loadingProjects = true;
        this.ps.getWorkspaceProjects().subscribe({
            next: (response) => {
                this.projects = response.data;
                // Try to restore previously selected project
                const projectId = this.ss.getItem<string>('project');
                if (projectId) {
                    const savedProject = this.projects.find(
                        (p) => p.id === projectId,
                    );
                    if (savedProject) {
                        this.selectedProject = savedProject;
                    }
                }

                // Select first project by default if available and none selected
                if (this.projects.length > 0 && !this.selectedProject) {
                    this.selectedProject = this.projects[0];
                    this.ss.setItem('project', this.selectedProject.id);
                }

                // Show first project dialog if no projects exist and none selected
                if (this.projects.length === 0 && !this.selectedProject) {
                    this.firstProjectDialogVisible = true;
                }

                this.loadingProjects = false;
            },
            error: (error) => {
                console.error('Failed to load projects:', error);
                this.loadingProjects = false;
            },
        });
    }

    private initializeProjectSelection() {
        // Check if workspace exists and load projects
        const workspaceId = this.ss.getItem<string>('workspace');
        if (workspaceId) {
            this.loadProjects();
        }
    }

    // First project dialog event handlers
    onFirstProjectCreated(project: IProject) {
        console.log('First project created:', project.name);
        this.selectedProject = project;
        this.projects.push(project);
        this.firstProjectDialogVisible = false;
    }

    onFirstProjectDialogVisibleChange(visible: boolean) {
        this.firstProjectDialogVisible = visible;
    }

    onFirstProjectSkipped() {
        console.log('First project dialog skipped');
        this.firstProjectDialogVisible = false;
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

    openBilling() {
        this.dialogService.openBillingDialog();
    }
}
