import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationLinksProps {
    links: PaginationLink[];
}

function decodeLabel(label: string): string {
    return label
        .replace(/&laquo;/g, 'Previous')
        .replace(/&raquo;/g, 'Next')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '')
        .trim();
}

export function PaginationLinks({ links }: PaginationLinksProps) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-4">
            {links.map((link) => {
                const label = decodeLabel(link.label);

                if (link.url === null) {
                    return (
                        <Button key={label} type="button" variant="outline" size="sm" disabled>
                            {label}
                        </Button>
                    );
                }

                return (
                    <Button key={`${label}-${link.url}`} type="button" variant={link.active ? 'default' : 'outline'} size="sm" asChild>
                        <Link href={link.url} preserveScroll>
                            {label}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
}
