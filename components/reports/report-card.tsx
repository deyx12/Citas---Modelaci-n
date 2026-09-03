type ReportCardProps = {
  title: string;
  value: string;
};

export function ReportCard({ title, value }: ReportCardProps) {
  return (
    <article>
      <h3>{title}</h3>
      <strong>{value}</strong>
    </article>
  );
}
