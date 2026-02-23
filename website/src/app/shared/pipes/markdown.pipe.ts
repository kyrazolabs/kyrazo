import { Pipe, PipeTransform } from '@angular/core';
import { Marked, Tokens } from 'marked';

@Pipe({
    name: 'markdown',
    standalone: true,
})
export class MarkdownPipe implements PipeTransform {
    private marked = new Marked();

    constructor() {
        this.marked.use({
            renderer: {
                // Custom Heading Styles
                heading(this: any, { tokens, depth }: Tokens.Heading) {
                    const text = this.parser.parseInline(tokens);
                    const sizes: { [key: number]: string } = {
                        1: 'text-3xl sm:text-4xl md:text-5xl font-bold text-surface-900 dark:text-surface-0 mt-6 sm:mt-8 mb-4 sm:mb-6',
                        2: 'text-2xl sm:text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-0 mt-6 sm:mt-8 mb-3 sm:mb-4 border-b border-surface-200 dark:border-surface-700 pb-2',
                        3: 'text-xl sm:text-2xl md:text-3xl font-bold text-surface-800 dark:text-surface-100 mt-5 sm:mt-6 mb-2 sm:mb-3',
                        4: 'text-lg sm:text-xl font-bold text-surface-800 dark:text-surface-100 mt-5 sm:mt-6 mb-2',
                        5: 'text-base sm:text-lg font-bold text-surface-800 dark:text-surface-100 mt-4 mb-2',
                        6: 'text-sm sm:text-base font-bold text-surface-800 dark:text-surface-100 mt-4 mb-2',
                    };
                    const className = sizes[depth] || sizes[6];
                    return `
                      <h${depth} class="${className}">
                        ${text}
                      </h${depth}>`;
                },

                // Custom Paragraph Styles
                paragraph(this: any, { tokens }: Tokens.Paragraph) {
                    const text = this.parser.parseInline(tokens);
                    return `<p class="mb-4 text-base sm:text-lg text-surface-700 dark:text-surface-300 leading-relaxed">${text}</p>`;
                },

                // Custom List Styles (requires parsing items)
                list(this: any, token: Tokens.List) {
                    let body = '';
                    for (const item of token.items) {
                        body += this.listitem(item);
                    }
                    const type = token.ordered ? 'list-decimal' : 'list-disc';
                    const tag = token.ordered ? 'ol' : 'ul';
                    return `<${tag} class="${type} list-outside ml-5 sm:ml-6 mb-5 sm:mb-6 space-y-1.5 sm:space-y-2 text-base sm:text-lg text-surface-700 dark:text-surface-300">\n${body}</${tag}>\n`;
                },

                // Custom List Item Styles
                listitem(this: any, item: Tokens.ListItem) {
                    const content = this.parser.parse(item.tokens);
                    return `<li class="pl-2 marker:text-primary">${content}</li>\n`;
                },

                // Custom Strong/Bold Styles
                strong({ text }: Tokens.Strong) {
                    return `<strong class="font-bold text-surface-900 dark:text-surface-0">${text}</strong>`;
                },

                // Custom Link Styles
                link({ href, title, text }: Tokens.Link) {
                    return `<a href="${href}" class="text-primary hover:text-primary-emphasis underline underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer" title="${title || ''}">${text}</a>`;
                },
            },
        });
    }

    transform(value: string | null | undefined): string {
        if (!value) {
            return '';
        }
        return this.marked.parse(value) as string;
    }
}
