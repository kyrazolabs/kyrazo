import {
    Component,
    inject,
    OnInit,
    AfterViewInit,
    ViewChild,
    ElementRef,
    HostListener,
} from '@angular/core';
import { dropdownAnimation } from '@shared/animations/dropdown.animation';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Popover, PopoverModule } from 'primeng/popover';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { StorageService } from '@core/services/storage.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { IWorkspace, IWorkspaceMembership } from '@models/workspaces.types';
import { TooltipModule } from 'primeng/tooltip';
import { SupportDialogComponent } from '@shared/components/support-dialog/support-dialog.component';
import { ToastModule } from 'primeng/toast';
import { LayoutService } from '../service/layout.service';

@Component({
    selector: 'app-sidebar',
    imports: [
        CommonModule,
        FormsModule,
        MenuModule,
        RouterLink,
        BadgeModule,
        DrawerModule,
        RippleModule,
        AvatarModule,
        PopoverModule,
        TooltipModule,
        InputGroupAddonModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        CardModule,
        ToastModule,
        SupportDialogComponent,
    ],
    providers: [MessageService],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.scss',
    animations: [dropdownAnimation],
})
export class SidebarComponent implements OnInit, AfterViewInit {
    private ss = inject(StorageService);
    private ws = inject(WorkspaceService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    public layoutService = inject(LayoutService);

    currentRoute = '';
    dispatchDropdownOpen = false;
    ingestDropdownOpen = false;

    items: MenuItem[] | undefined;
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
                    url: '/settings/billing',
                    description: 'Subscription & payments',
                    status: 'active',
                    shortcut: '⌘+B',
                },
            ],
        },
    ];
    helpVisible: boolean = false;
    @ViewChild('drawerRef') drawerRef!: Drawer;
    @ViewChild('wp') wp!: Popover;
    @ViewChild('pp') pp!: Popover;
    @ViewChild('helpContainer', { static: false }) helpContainer!: ElementRef;
    @ViewChild('helpMenu', { static: false }) helpMenu!: ElementRef;

    selectedWorkspace: IWorkspace | null = null;
    workspaceMemberships: IWorkspaceMembership[] = [];
    loading = false;

    toggle(event: any) {
        this.wp.toggle(event);
    }

    selectWorkspace(workspace: IWorkspace) {
        this.selectedWorkspace = workspace;
        this.ss.setItem('workspace', workspace.id);
        this.wp.hide();
    }

    generateHashtag(name: string): string {
        if (!name) return '#';
        return name.charAt(0).toUpperCase();
    }

    closeCallback(e: any): void {
        this.drawerRef.close(e);
    }

    visible: boolean = false;

    loadWorkspaces() {
        this.loading = true;
        this.ws.gets().subscribe({
            next: (response) => {
                this.workspaceMemberships = response.data;
                // Select first workspace by default if available
                if (
                    this.workspaceMemberships.length > 0 &&
                    !this.selectedWorkspace
                ) {
                    this.selectedWorkspace =
                        this.workspaceMemberships[0].workspace;
                    this.ss.setItem('workspace', this.selectedWorkspace.id);
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load workspaces:', error);
                this.loading = false;
            },
        });
    }

    ngOnInit() {
        this.loadWorkspaces();
        this.currentRoute = this.router.url;
        this.updateDropdownStates();

        // Subscribe to route changes
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this.currentRoute = event.url;
                this.updateDropdownStates();
            });
    }

    ngAfterViewInit() {
        // Required for AfterViewInit interface
    }

    // Method to check if a route is active
    isRouteActive(route: string): boolean {
        return (
            this.currentRoute === route ||
            this.currentRoute.startsWith(route + '/')
        );
    }

    // Method to update dropdown states based on active routes
    private updateDropdownStates(): void {
        // Only open if active. Do NOT auto-close strictly on route change to prevent "snap close".
        if (this.isRouteActive('/events/dispatch')) {
            this.dispatchDropdownOpen = true;
        }

        if (this.isRouteActive('/events/ingest')) {
            this.ingestDropdownOpen = true;
        }
    }

    toggleDispatch() {
        this.dispatchDropdownOpen = !this.dispatchDropdownOpen;
    }

    toggleIngest() {
        this.ingestDropdownOpen = !this.ingestDropdownOpen;
    }

    toggleHelp(event: Event) {
        event.stopPropagation();
        this.helpVisible = !this.helpVisible;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event) {
        if (this.helpVisible && this.helpContainer && this.helpMenu) {
            const clickedInside =
                this.helpContainer.nativeElement.contains(event.target) ||
                this.helpMenu.nativeElement.contains(event.target);
            if (!clickedInside) {
                this.helpVisible = false;
            }
        }
    }

    openHelpDialog(): boolean {
        return (this.helpVisible = true);
    }

    // Support dialog state
    supportDialogVisible = false;

    openSupportDialog() {
        this.supportDialogVisible = true;
    }
}

// Optional: Interface for extended MenuItem properties
interface ExtendedMenuItem extends MenuItem {
    description?: string;
    badgeType?: 'success' | 'info' | 'warn' | 'danger';
    status?: 'active' | 'warn' | 'error';
}
