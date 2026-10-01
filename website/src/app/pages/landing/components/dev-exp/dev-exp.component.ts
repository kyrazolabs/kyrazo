import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { FormsModule } from '@angular/forms';
import { CodeEditorComponent } from '@shared/components/code-editor/code-editor.component';

@Component({
    selector: 'app-landing-dev-exp',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ScrollRevealDirective,
        CodeEditorComponent,
    ],
    templateUrl: './dev-exp.component.html',
    styleUrl: './dev-exp.component.scss',
})
export class DevExpComponent {
    codeSnippet = `import { Kyrazo } from "@kyrazo/sdk";

const kyrazo = new Kyrazo(process.env.KYRAZO_API_KEY);

// Dispatch an event to all subscribers
const result = await kyrazo.dispatch.single("ns_4863w...", {
    event: "order.shipped",
    payload: {
        id: "ord_99",
        customer: "cus_alice",
        amount_usd: 49.99,
        items: ["sku_001", "sku_002"],
    },
    targets: ["trg_2176c..."],
});`;
}
