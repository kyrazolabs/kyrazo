// keys.resolver.ts
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { KeyService, IKey } from '@core/services/key.service';
import { map } from 'rxjs/operators';

export const keysResolver: ResolveFn<IKey[]> = (route) => {
    const keyService = inject(KeyService);
    return keyService.gets().pipe(map(res => res.data));
};

export const keyResolver: ResolveFn<IKey> = (route) => {
    const keyService = inject(KeyService);
    const id = route.paramMap.get('id')!;
    // For now, we'll get all keys and find the one we need
    // In a real app, you'd want a getKey(id) method
    return keyService.gets().pipe(
        map(res => res.data.find(key => key._id === id)!)
    );
};