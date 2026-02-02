
export default function GradientText({
    children,
    className = "",
    as: Component = "span",
}: {
    children: React.ReactNode;
    className?: string;
    as?: any;
}) {
    return (
        <Component
            className={`text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-black tracking-tight ${className}`}
        >
            {children}
        </Component>
    );
}
