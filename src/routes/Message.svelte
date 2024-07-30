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
</script>

<div class="flex flex-col mx-1">
	{#if index === unreadMessageI}
		<div class="w-full rounded-md border-t-4 border-solid border-t-primary/30 mt-4">
		</div>
		<span class="px-2 py-1">Unread Messages ({unreadCount})</span>
	{/if}

	<div class="flex flex-row px-1 py-2 mt-2 w-full gap-2 items-center rounded-md bg-background/30">
		<Avatar src={cdnUrl(message.sender.id, 'big')} alt={message.sender.username} border={true} />

		<div class="flex flex-col gap-1 w-full">
			<div class="text-elipsis flex w-full flex-row gap-1 overflow-hidden truncate text-sm">
				<span class="font-bold">{message.sender.username}</span>
				<span class="font-bold text-muted-foreground">{dayjs.utc(message.created_at).tz().fromNow()}</span>
			</div>
			<span class="whitespace-pre-wrap break-all">{message.content}</span>
		</div>

		<Badge>{message.sender.iq}</Badge>
	</div>
</div>
