export interface CmsResponse<T> {
    data: T;
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

export interface Article {
    id: number;
    documentId: string;
    title: string;
    description: string;
    blocks: CmsBlock[];
    slug: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    cover?: CmsMedia;
    category?: Category;
    author?: Author;
}

export type CmsBlock = RichTextBlock | QuoteBlock | MediaBlock;

export interface RichTextBlock {
    __component: 'shared.rich-text';
    id: number;
    body: string;
}

export interface QuoteBlock {
    __component: 'shared.quote';
    id: number;
    title: string;
    body: string;
}

export interface MediaBlock {
    __component: 'shared.media';
    id: number;
    file?: CmsMedia;
}

export interface Category {
    id: number;
    documentId: string;
    name: string;
    slug: string;
}

export interface Author {
    id: number;
    documentId: string;
    name: string;
    email: string;
    picture?: CmsMedia;
}

export interface CmsMedia {
    id: number;
    documentId: string;
    name: string;
    alternativeText: string;
    caption: string;
    width: number;
    height: number;
    url: string;
    formats: {
        thumbnail: MediaFormat;
        small: MediaFormat;
        medium: MediaFormat;
        large: MediaFormat;
    };
}

export interface MediaFormat {
    name: string;
    hash: string;
    ext: string;
    mime: string;
    width: number;
    height: number;
    size: number;
    url: string;
}
