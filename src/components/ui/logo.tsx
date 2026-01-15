export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <span className="text-2xl font-bold text-botfy-primary">Botfy</span>
      <span className="ml-1 text-sm font-medium text-muted-foreground">
        ClinicOps
      </span>
    </div>
  );
}
