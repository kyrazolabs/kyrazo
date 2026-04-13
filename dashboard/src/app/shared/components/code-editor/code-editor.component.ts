import {
    Component,
    ElementRef,
    forwardRef,
    Input,
    OnChanges,
    OnDestroy,
    AfterViewInit,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EditorState, Extension, Compartment, Prec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
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
    @Input() theme: 'dark' | 'light' = 'dark';
    @Input() readonly = false;

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

    ngAfterViewInit(): void {
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
                    this.theme === 'dark' ? oneDark : [],
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
    }

    ngOnDestroy(): void {
        this.destroyEditor();
    }

    private initEditor(): void {
        const extensions: Extension[] = [
            basicSetup,
            this.languageCompartment.of(this.getLanguageExtensions()),
            this.themeCompartment.of(this.theme === 'dark' ? oneDark : []),
            this.readonlyCompartment.of(this.getReadonlyExtensions()),
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

    private isEffectivelyReadonly(): boolean {
        return this.readonly || this.formDisabled;
    }

    private getReadonlyExtensions(): Extension[] {
        if (this.isEffectivelyReadonly()) {
            return [
                Prec.highest(EditorState.readOnly.of(true)),
                Prec.highest(EditorView.editable.of(false)),
                EditorView.contentAttributes.of({ tabindex: '0' })
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
