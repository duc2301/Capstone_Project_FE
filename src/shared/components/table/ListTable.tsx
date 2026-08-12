import type { ReactNode } from 'react';

export interface ListTableColumn {
  key: string;
  label?: ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ListTableProps {
  columns: ListTableColumn[];
  minWidth?: string;
  dense?: boolean;
  stickyHead?: boolean;
  filledHead?: boolean;
  children: ReactNode;
}

const ALIGN_CLASS = {
  left: '',
  center: 'text-center',
  right: 'text-right',
} as const;

export function ListTable({
  columns,
  minWidth = '',
  dense = false,
  stickyHead = true,
  filledHead = true,
  children,
}: ListTableProps) {
  const firstCell = dense ? 'py-2.5 pr-3' : 'px-6 py-3.5';
  const cell = dense ? 'px-3 py-2.5' : 'px-5 py-3.5';

  return (
    <table className={`table-list ${minWidth}`}>
      <colgroup>
        {columns.map((col) => (
          <col key={col.key} className={col.width} />
        ))}
      </colgroup>
      <thead className={stickyHead ? 'sticky top-0 z-10' : undefined}>
        <tr className={`table-head ${filledHead ? 'bg-content-bg' : ''}`}>
          {columns.map((col, index) => (
            <th
              key={col.key}
              className={`${index === 0 ? firstCell : cell} ${ALIGN_CLASS[col.align ?? 'left']}`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      {children}
    </table>
  );
}
