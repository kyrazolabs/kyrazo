import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, AfterViewInit, ElementRef, HostListener  } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

import { dropdownAnimation } from '@shared/animations/dropdown.animation';

import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { PopoverModule } from 'primeng/popover';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { CardModule } from "primeng/card";

@Component({
  selector: 'app-settings.page',
  imports: [CommonModule, FormsModule, MenuModule, RouterLink, BadgeModule, DrawerModule, RippleModule, AvatarModule, PopoverModule, InputGroupAddonModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, CardModule, RouterOutlet],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  @ViewChild('outlet', { static: true }) outlet!: RouterOutlet;

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  
    animationState: string = '';
  footerAnimationKey: string = '';

    currentRoute = '';


  childRoute(outlet: RouterOutlet) {
      return outlet?.activatedRouteData?.['animation'];
    }  
    ngOnInit() {
      this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
        this.footerAnimationKey = this.router.url;
      });
    }
  
    ngAfterViewInit() {
      this.updateAnimationState();
    }
  
    private updateAnimationState() {
      this.animationState = this.outlet?.isActivated ? this.outlet.activatedRoute.snapshot.data['animation'] : '';
      this.cdr.detectChanges();
    }
    // Method to check if a route is active
    isRouteActive(route: string): boolean {
      return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
    }

}
