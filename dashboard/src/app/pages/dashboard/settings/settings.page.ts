import {
    Component,
    inject,
    ChangeDetectorRef,
    OnInit,
    ViewChild,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { PopoverModule } from 'primeng/popover';
import { TabsModule } from 'primeng/tabs';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Child Components
import { ProfileSettingsPage } from './profile/profile.page';
import { NotificationSettingsPage } from './notification/notification.page';
import { WorkspaceSettingsPage } from './workspace/workspace.page';
import { BillingSettingsPage } from './billing/billing.page';

@Component({
    selector: 'app-settings.page',
    imports: [
        CommonModule,
        FormsModule,
        MenuModule,
        BadgeModule,
        DrawerModule,
        RippleModule,
        AvatarModule,
        PopoverModule,
        InputGroupAddonModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        CardModule,
        TabsModule,
        IconFieldModule,
        InputIconModule,
        ProfileSettingsPage,
        NotificationSettingsPage,
        WorkspaceSettingsPage,
        BillingSettingsPage,
        ToastModule,
        ConfirmDialogModule,
    ],
    templateUrl: './settings.page.html',
    styleUrl: './settings.page.scss',
})
export class SettingsPage implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    currentTab = 'profile';

    @ViewChild('profileComp') profileComp?: ProfileSettingsPage;
    @ViewChild('notificationComp') notificationComp?: NotificationSettingsPage;
    @ViewChild('workspaceComp') workspaceComp?: WorkspaceSettingsPage;
    @ViewChild('billingComp') billingComp?: BillingSettingsPage;

    ngOnInit() {
        this.route.queryParams.subscribe((params) => {
            if (params['tab']) {
                this.currentTab = params['tab'];
            }
        });
    }

    onTabChange(event: any) {
        this.currentTab = event;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab: event },
            queryParamsHandling: 'merge',
        });
    }
}
