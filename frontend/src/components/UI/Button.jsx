const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  light: "bg-white text-brand-900 hover:bg-gray-100",
  gold: "bg-accent-gold text-brand-900 hover:brightness-95",
};

export default function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      className={`w-full rounded-full py-3 text-center text-sm font-semibold transition-colors disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
