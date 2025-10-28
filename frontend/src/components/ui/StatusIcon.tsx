interface StatusIconProps {
  ok: boolean;
}

export default function StatusIcon({ ok }: StatusIconProps) {
  return ok ? (
    <span className="inline-block align-middle text-green-400 mr-2">✔️</span>
  ) : (
    <span className="inline-block align-middle text-red-400 mr-2">✖️</span>
  );
} 