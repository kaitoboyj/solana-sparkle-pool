interface StatsCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const StatsCard = ({ label, value, icon }: StatsCardProps) => {
  return (
    <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300 animate-pulse-glow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted-foreground text-sm uppercase tracking-wider">{label}</p>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

export default StatsCard;
