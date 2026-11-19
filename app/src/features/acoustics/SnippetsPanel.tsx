"use client";
import { useChannels, useSnippets } from "@/features/hooks";
import type { Id, Machine } from "@/lib/api/types";
import { Skeleton } from "@/ui/atoms";
import { Card } from "@/ui/cells";
import { AudioSnippet } from "@/ui/organisms/AudioSnippet";
import { audioChannel } from "./pick";

export function SnippetsPanel({ machine }: { machine: Machine }) {
  const channels = useChannels(machine.id);
  const mic = audioChannel(channels.data ?? []);
  return (
    <Card id="snippets-h" title="Snippets" className="mt-5">
      <div className="flex flex-col gap-3 pb-4">
        {channels.isPending ? <Skeleton className="h-12 w-full" />
          : !mic ? <p className="text-body text-muted">No microphone on this machine.</p>
            : <SnippetList channelId={mic.id} rpm={machine.rpm ?? 0} faulty={machine.health === "watch" || machine.health === "alarm"} />}
        <p className="text-small text-muted">
          Only snippets that passed the voice filter can be played. Nothing is recorded from people.
        </p>
      </div>
    </Card>
  );
}

function SnippetList({ channelId, rpm, faulty }: { channelId: Id; rpm: number; faulty: boolean }) {
  const snippets = useSnippets(channelId);
  if (snippets.isPending) return <Skeleton className="h-12 w-full" />;
  if (!snippets.data?.length) return <p className="text-body text-muted">No snippets yet for this channel.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {snippets.data.map((s) => (
        <li key={s.id}>
          <AudioSnippet snippet={s} rpm={rpm} faulty={faulty} />
        </li>
      ))}
    </ul>
  );
}
