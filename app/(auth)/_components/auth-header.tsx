export function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[#E1F5EE]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6 text-[#0F6E56]"
        >
          <path
            d="M4 9v6M2 10v4M6 7v10M18 7v10M22 10v4M20 9v6M8 12h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-3xl font-bold text-zinc-900">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}
