<script lang="ts">
	import { type Message } from './MessagesPage.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Avatar from './Avatar.svelte'
	import { cdnUrl } from './stores';

	import dayjs from 'dayjs';
	import utc from 'dayjs/plugin/utc';
	import timezone from 'dayjs/plugin/timezone';
	import relativeTime from 'dayjs/plugin/relativeTime';

	dayjs.extend(utc);
	dayjs.extend(timezone);
	dayjs.extend(relativeTime);
	dayjs.tz.guess();

	export let message: Message;
	export let index: number;
	export let unreadMessageI: number;
	export let unreadCount: number;
	export let handleLyntClick: (id: string) => void;
	export let myId: string;
</script>

{#if index === unreadMessageI}
	<div class="text-center">
		<div class="w-full rounded-md border-t-4 border-solid border-t-border mt-4">
		</div>
		<span class="px-2 py-1">Unread Messages ({unreadCount})</span>
	</div>
{/if}

<div class="flex flex-col mx-1 {message.sender.id === myId ? 'items-end' : ''}">
	<div class="flex flex-row px-1 py-2 mt-2 w-fit max-w-full gap-2 rounded-md {message.sender.id === myId ? 'bg-input/70' : 'bg-input'}">
		<Avatar src={cdnUrl(message.sender.id, 'big')} alt={message.sender.username} border={true} />

		<div class="flex flex-col gap-1 w-full">
			<div class="text-elipsis flex w-full flex-row gap-1 overflow-hidden truncate text-sm">
				<span class="font-bold">{message.sender.username}</span>
				<span class="font-bold text-muted-foreground">{dayjs.utc(message.created_at).tz().fromNow()}</span>
			</div>
			<span class="whitespace-pre-wrap break-all">{message.content}</span>
			{#if message.image}
				<img src={cdnUrl(message.image)} alt="" class="max-w-full max-h-[400px] overflow-hidden" />
			{/if}
		</div>

		<Badge class="h-6">{message.sender.iq}</Badge>
	</div>
</div>
