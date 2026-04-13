import {
    Component,
    ElementRef,
    forwardRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
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
    { label: 'previous', type: 'property', info: 'Previous state of the object' },
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
            }
            .code-editor-host {
                height: 100%;
            }
            ::ng-deep .cm-editor {
                height: 100%;
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
    implements OnInit, OnDestroy, OnChanges, ControlValueAccessor
{
    @ViewChild('editorHost', { static: true })
    editorHost!: ElementRef<HTMLDivElement>;
    @Input() language: 'javascript' | 'json' = 'javascript';
    @Input() theme: 'dark' | 'light' = 'dark';
    @Input() readonly = false;

    private view: EditorView | null = null;
    private value = '';
    private onChange: (v: string) => void = () => {};
    private onTouched: () => void = () => {};
    private updatingFromOutside = false;

    ngOnInit(): void {
        this.initEditor();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['language'] || changes['theme'] || changes['readonly']) &&
            this.view
        ) {
            this.destroyEditor();
            this.initEditor();
        }
    }

    ngOnDestroy(): void {
        this.destroyEditor();
    }

    private initEditor(): void {
        const extensions: Extension[] = [
            basicSetup,
            this.getLanguageExtension(),
            EditorView.updateListener.of((update) => {
                if (update.docChanged && !this.updatingFromOutside) {
                    const val = update.state.doc.toString();
                    this.value = val;
                    this.onChange(val);
                    this.onTouched();
                }
            }),
        ];

        // Add transformer completions for JS/TS
        if (this.language === 'javascript') {
            extensions.push(
                javascriptLanguage.data.of({
                    autocomplete: transformerCompletionSource,
                }),
            );
        }

        if (this.theme === 'dark') {
            extensions.push(oneDark);
        }

        if (this.readonly) {
            extensions.push(EditorState.readOnly.of(true));
            extensions.push(EditorView.editable.of(false));
            extensions.push(EditorView.contentAttributes.of({ tabindex: '0' }));
        }

        const state = EditorState.create({
            doc: this.value,
            extensions,
        });

        this.view = new EditorView({
            state,
            parent: this.editorHost.nativeElement,
        });
    }

    private getLanguageExtension(): Extension {
        switch (this.language) {
            case 'json':
                return json();
            case 'javascript':
            default:
                return javascript({ typescript: true });
        }
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
        this.readonly = isDisabled;
        if (this.view) {
            this.destroyEditor();
            this.initEditor();
        }
    }
}
