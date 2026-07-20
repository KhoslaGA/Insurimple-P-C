/**
 * FieldList — label/value pairs for a detail panel.
 *
 * The prototype's policy detail is a dense read-only grid of Epic accounting
 * fields; this is that pattern factored out so every detail panel renders
 * identically.
 */

export type Field = {
  label: string;
  value: React.ReactNode;
  /** Span both columns — for long values like an invoice-to address. */
  wide?: boolean;
};

type FieldListProps = {
  fields: Field[];
};

export function FieldList({ fields }: FieldListProps) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.label}
          className={field.wide ? "sm:col-span-2" : undefined}
        >
          <dt className="text-caption uppercase tracking-[0.06em] text-text-3">
            {field.label}
          </dt>
          {/* Values may be missing; an em dash reads better than a blank gap. */}
          <dd className="mt-1 text-small text-text-1">{field.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
