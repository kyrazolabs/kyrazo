import { Routes } from '@angular/router';
import {
    preferencesResolver,
    profileResolver,
} from '@core/resolver/settings.resolver';
import { WorkspaceSettingsResolver } from './workspace/workspace.reslover';
import { SettingsPage } from './settings.page';

export const settingsRoutes: Routes = [
    {
        path: '',
        component: SettingsPage,
        resolve: {
            profile: profileResolver,
            notiPreferences: preferencesResolver,
            workspace: WorkspaceSettingsResolver,
        },
        data: { title: 'Settings', animation: 'settings' },
    },
];
