const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark blue gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220_70%_8%)] via-[hsl(215_80%_12%)] to-[hsl(210_90%_15%)]" />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210_100%_25%)] via-transparent to-[hsl(195_100%_25%)] animate-gradient bg-[length:200%_200%]" />
      </div>
      
      {/* Floating orbs - Blue themed */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(210_100%_50%)]/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(195_100%_60%)]/25 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-[hsl(210_100%_45%)]/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute top-3/4 left-1/3 w-72 h-72 bg-[hsl(220_100%_55%)]/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Grid overlay with better visibility */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:80px_80px]" />
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
    </div>
  );
};

export default AnimatedBackground;
