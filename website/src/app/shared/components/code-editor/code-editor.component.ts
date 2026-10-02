import {
    Component,
    ElementRef,
    forwardRef,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    AfterViewInit,
    PLATFORM_ID,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EditorState, Extension, Compartment, Prec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { material } from '@uiw/codemirror-theme-material';
import { oneDark } from '@codemirror/theme-one-dark';
import { tags as t } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';

// Nebula Theme — matches the Features section's blue/purple comet aesthetic
const nebulaTheme = EditorView.theme({
    "&": {
        color: "#c8d0e7",
        backgroundColor: "transparent",
        fontSize: "13.5px",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    },
    ".cm-content": {
        caretColor: "#a78bfa",
        padding: "12px 0",
    },
    ".cm-line": {
        padding: "0 16px",
        lineHeight: "1.75",
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: "#a78bfa"
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "rgba(139, 92, 246, 0.2)"
    },
    ".cm-activeLine": {
        backgroundColor: "rgba(255, 255, 255, 0.03)"
    },
    ".cm-gutters": { display: "none" },
    ".cm-panels": { backgroundColor: "transparent", color: "#c8d0e7" },
    ".cm-panels.cm-panels-top": { borderBottom: "1px solid rgba(255,255,255,0.06)" },
    ".cm-panels.cm-panels-bottom": { borderTop: "1px solid rgba(255,255,255,0.06)" },
    ".cm-tooltip": { backgroundColor: "#1a1a2e", border: "1px solid rgba(139,92,246,0.3)" },
    ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "rgba(139,92,246,0.2)" },
    ".cm-scroller": {
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(99, 102, 241, 0.5) transparent",
    },
}, {dark: true});

const nebulaHighlightStyle = HighlightStyle.define([
    // Keywords: vivid electric violet
    {tag: t.keyword, color: "#c084fc", fontWeight: "700"},
    // Module keywords (import, export, from): sky blue
    {tag: [t.moduleKeyword], color: "#38bdf8", fontWeight: "700"},
    // Definition keywords (const, let, var, function): violet
    {tag: [t.definitionKeyword], color: "#a78bfa", fontWeight: "700"},
    // Control flow (return, if, else, await): bright fuchsia
    {tag: [t.controlKeyword], color: "#e879f9", fontWeight: "700"},
    // Function call names: bright sky blue
    {tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#38bdf8", fontWeight: "600"},
    // Variable names: light lavender-white
    {tag: [t.variableName], color: "#e2e8f0"},
    // Property names: periwinkle blue
    {tag: [t.propertyName], color: "#7dd3fc"},
    // Strings: vivid emerald / teal — must be highly visible
    {tag: [t.string], color: "#34d399", fontWeight: "500"},
    {tag: [t.special(t.string)], color: "#6ee7b7"},
    // Numbers: bright amber-yellow
    {tag: [t.number, t.integer, t.float], color: "#fbbf24", fontWeight: "500"},
    // Boolean / null / undefined: hot pink
    {tag: [t.bool, t.null, t.atom], color: "#f472b6"},
    // Operators: vivid violet
    {tag: [t.operator, t.punctuation, t.arithmeticOperator, t.logicOperator, t.compareOperator], color: "#a78bfa"},
    // Separator / punctuation (dots, colons, etc): medium slate
    {tag: [t.separator, t.squareBracket, t.angleBracket], color: "#94a3b8"},
    // Braces: soft white
    {tag: [t.brace], color: "#cbd5e1"},
    // Class / type names: bright indigo
    {tag: [t.typeName, t.className, t.tagName], color: "#818cf8"},
    // Comments: muted graphite italics
    {tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: "#4b5563", fontStyle: "italic"},
    // Regexp: hot pink
    {tag: [t.regexp], color: "#f472b6"},
    // Self / this: violet
    {tag: [t.self], color: "#c084fc"},
    // Links: sky blue underlined
    {tag: t.link, color: "#38bdf8", textDecoration: "underline"},
    // Escape sequences inside strings: amber
    {tag: [t.escape], color: "#fbbf24"},
    // Template literal interpolation
    {tag: [t.special(t.variableName)], color: "#e879f9"},
]);

const nebulaScrollbarStyle = EditorView.baseTheme({
    ".cm-scroller::-webkit-scrollbar": {
        width: "6px",
        height: "6px",
    },
    ".cm-scroller::-webkit-scrollbar-track": {
        background: "transparent",
    },
    ".cm-scroller::-webkit-scrollbar-thumb": {
        background: "rgba(99, 102, 241, 0.5)",
        borderRadius: "3px",
    },
    ".cm-scroller::-webkit-scrollbar-thumb:hover": {
        background: "rgba(99, 102, 241, 0.8)",
    },
});

export const nebulaThemeBundle = [nebulaTheme, nebulaScrollbarStyle, syntaxHighlighting(nebulaHighlightStyle)];

import {
    autocompletion,
    CompletionContext,
    CompletionResult,
} from '@codemirror/autocomplete';

const GLOBALS = [
    { label: 'payload', type: 'variable', info: 'The incoming event payload' },
    {
        label: '_',
        type: 'variable',
        info: 'Lodash utility for data manipulation',
    },
    { label: 'dayjs', type: 'variable', info: 'Date/time utility' },
    { label: 'crypto', type: 'variable', info: 'Cryptographic utilities' },
];

const PAYLOAD_PROPS = [
    { label: 'id', type: 'property', info: 'Unique event ID (Static)' },
    { label: 'type', type: 'property', info: 'Event type string (Static)' },
    { label: 'timestamp', type: 'property', info: 'Event timestamp (Static)' },
    { label: 'data', type: 'property', info: 'Event data (Customizable)' },
];

const DATA_PROPS = [
    { label: 'object', type: 'property', info: 'Main event object' },
    {
        label: 'previous',
        type: 'property',
        info: 'Previous state of the object',
    },
];

const CRYPTO_PROPS = [
    { label: 'createHmac', type: 'function' },
    { label: 'createHash', type: 'function' },
];

function transformerCompletionSource(
    context: CompletionContext,
): CompletionResult | null {
    // 1. Check for specific property access (context-aware)
    const dataMatch = context.matchBefore(/payload\.data\.\w*/);
    if (dataMatch) {
        return {
            from: dataMatch.from + 'payload.data.'.length,
            options: DATA_PROPS,
        };
    }

    const payloadMatch = context.matchBefore(/payload\.\w*/);
    if (payloadMatch) {
        return {
            from: payloadMatch.from + 'payload.'.length,
            options: PAYLOAD_PROPS,
        };
    }

    const cryptoMatch = context.matchBefore(/crypto\.\w*/);
    if (cryptoMatch) {
        return {
            from: cryptoMatch.from + 'crypto.'.length,
            options: CRYPTO_PROPS,
        };
    }

    // 2. Global variable completions
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) {
        return null;
    }

    return {
        from: word.from,
        options: GLOBALS,
    };
}

@Component({
    selector: 'app-code-editor',
    standalone: true,
    template: `<div #editorHost class="code-editor-host"></div>`,
    styles: [
        `
            :host {
                display: block;
                height: 100%;
                overflow: hidden;
            }
            .code-editor-host {
                height: 100%;
                overflow: hidden;
            }
            ::ng-deep .cm-editor {
                height: 100%;
                overflow: hidden;
            }
            ::ng-deep .cm-scroller {
                overflow: auto;
                font-family:
                    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
                font-size: 14px;
            }
        `,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CodeEditorComponent),
            multi: true,
        },
    ],
})
export class CodeEditorComponent
    implements AfterViewInit, OnDestroy, OnChanges, ControlValueAccessor
{
    @ViewChild('editorHost', { static: true })
    editorHost!: ElementRef<HTMLDivElement>;
    @Input() language: 'javascript' | 'json' = 'javascript';
    @Input() theme: 'dark' | 'light' | 'coolglow' | 'material' = 'dark';
    @Input() readonly = false;
    @Input() showLineNumbers = true;

    private readonly platformId = inject(PLATFORM_ID);
    private view: EditorView | null = null;
    private value = '';
    private formDisabled = false;
    private onChange: (v: string) => void = () => {};
    private onTouched: () => void = () => {};
    private updatingFromOutside = false;

    // Compartments for dynamic updates
    private languageCompartment = new Compartment();
    private themeCompartment = new Compartment();
    private readonlyCompartment = new Compartment();
    private lineNumbersCompartment = new Compartment();

    ngAfterViewInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        this.initEditor();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.view) return;

        if (changes['language']) {
            this.view.dispatch({
                effects: this.languageCompartment.reconfigure(
                    this.getLanguageExtensions(),
                ),
            });
        }

        if (changes['theme']) {
            this.view.dispatch({
                effects: this.themeCompartment.reconfigure(
                    this.getThemeExtensions(),
                ),
            });
        }

        if (changes['readonly']) {
            this.view.dispatch({
                effects: this.readonlyCompartment.reconfigure(
                    this.getReadonlyExtensions(),
                ),
            });
        }

        if (changes['showLineNumbers']) {
            this.view.dispatch({
                effects: this.lineNumbersCompartment.reconfigure(
                    this.getLineNumbersExtensions(),
                ),
            });
        }
    }

    ngOnDestroy(): void {
        this.destroyEditor();
    }

    private initEditor(): void {
        const extensions: Extension[] = [
            basicSetup,
            this.languageCompartment.of(this.getLanguageExtensions()),
            this.themeCompartment.of(this.getThemeExtensions()),
            this.readonlyCompartment.of(this.getReadonlyExtensions()),
            this.lineNumbersCompartment.of(this.getLineNumbersExtensions()),
            EditorView.updateListener.of((update) => {
                if (update.docChanged && !this.updatingFromOutside) {
                    const val = update.state.doc.toString();
                    this.value = val;
                    this.onChange(val);
                    this.onTouched();
                }
            }),
        ];

        // Create the editor with the current buffered value (may have been set
        // by writeValue before the editor existed)
        const state = EditorState.create({
            doc: this.value,
            extensions,
        });

        this.view = new EditorView({
            state,
            parent: this.editorHost.nativeElement,
        });
    }

    private getLanguageExtensions(): Extension[] {
        const extensions: Extension[] = [];
        if (this.language === 'json') {
            extensions.push(json());
        } else {
            extensions.push(javascript({ typescript: true }));
            extensions.push(
                javascriptLanguage.data.of({
                    autocomplete: transformerCompletionSource,
                }),
            );
        }
        return extensions;
    }

    private getThemeExtensions(): Extension[] {
        switch (this.theme) {
            case 'material':
                return [material];
            case 'coolglow':
                return [nebulaThemeBundle];
            case 'dark':
                return [oneDark];
            default:
                return [];
        }
    }

    private getLineNumbersExtensions(): Extension[] {
        return this.showLineNumbers ? [] : [
            EditorView.theme({
                ".cm-gutters": { display: "none !important" }
            })
        ];
    }

    private isEffectivelyReadonly(): boolean {
        return this.readonly || this.formDisabled;
    }

    private getReadonlyExtensions(): Extension[] {
        if (this.isEffectivelyReadonly()) {
            return [
                Prec.highest(EditorState.readOnly.of(true)),
                Prec.highest(EditorView.editable.of(false)),
                EditorView.contentAttributes.of({ tabindex: '0' }),
                Prec.highest(
                    EditorState.transactionFilter.of((tr) => {
                        // Drop any document changes that aren't programmatic
                        if (tr.docChanged && !this.updatingFromOutside) {
                            return [];
                        }
                        return tr;
                    }),
                ),
            ];
        }
        return [];
    }

    private destroyEditor(): void {
        this.view?.destroy();
        this.view = null;
    }

    // ControlValueAccessor
    writeValue(val: string): void {
        this.value = val ?? '';
        if (this.view) {
            this.updatingFromOutside = true;
            this.view.dispatch({
                changes: {
                    from: 0,
                    to: this.view.state.doc.length,
                    insert: this.value,
                },
            });
            this.updatingFromOutside = false;
        }
    }

    registerOnChange(fn: (v: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.formDisabled = isDisabled;
        if (this.view) {
            this.view.dispatch({
                effects: this.readonlyCompartment.reconfigure(
                    this.getReadonlyExtensions(),
                ),
            });
        }
    }
}
