import { Chat } from "@/components/Chat";

export default function Home() {
  return (
    <div className="flex h-full w-full flex-1 flex-col bg-[var(--background)]">
      <Chat />
    </div>
  );
}
