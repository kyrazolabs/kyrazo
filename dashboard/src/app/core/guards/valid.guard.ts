import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class ValidTypeGuard implements CanActivate {
    private allowedTypes = ['publish', 'receive', 'forward'];

    constructor(private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const type = route.paramMap.get('type');

        if (type && this.allowedTypes.includes(type)) {
            return true;
        }

        this.router.navigate(['/webhooks/create']);
        return false;
    }
}
