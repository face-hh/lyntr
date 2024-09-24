<script lang="ts">
	import { type Message } from './MessagesPage.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Avatar from './Avatar.svelte';
	import { cdnUrl } from './stores';
	import { inview } from '$lib/inview';
	import * as Popover from "$lib/components/ui/popover";
	import { Button } from "$lib/components/ui/button";
	import { Copy } from 'lucide-svelte';
	import Lynt from './Lynt.svelte';
	import { EllipsisVertical } from 'lucide-svelte';

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
	export let unreadTop: boolean = false;

	let open = false;
</script>

{#if index === unreadMessageI}
	<div
		class="flex flex-col gap-2 text-center"
		use:inview={{}}
		on:inview_change={(event) => {
			const { inView } = event.detail;
			unreadTop = !inView;
		}}
	>
		<div class="mt-4 w-full rounded-md border-t-4 border-solid border-t-border"></div>
		<span>Unread Messages ({unreadCount})</span>
	</div>
{/if}

<div class="group mr-1 w-fit flex {message.sender.id === myId ? 'ml-auto flex-row' : 'flex-row-reverse'} pt-2">
<div class="hidden group-has-[:hover]:flex items-center pr-2">
<Popover.Root bind:open={open}>
	<Popover.Trigger class="px-1">
		<EllipsisVertical size={16} />
	</Popover.Trigger>
	<Popover.Content class="flex flex-col gap-1 w-52 rounded-xl p-0" overlap={true} side="top">
		<span class="text-sm text-muted-foreground px-6 pt-4 pb-2">{dayjs.utc(message.created_at).tz().fromNow()}</span>
		<div class="bg-secondary w-full h-[1px]"></div>
		<Button variant="ghost" class="flex justify-between gap-1 pb-4" on:click={(e) => {
			navigator.clipboard.writeText(message.content);
			open = false;
		}}>Copy <Copy size={20} /></Button>
	</Popover.Content>
</Popover.Root>
</div>
	<div
		class="mt-2 w-fit flex max-w-[360px] md:max-w-screen-72 lg:max-w-md flex-row gap-2 rounded-3xl px-3 py-2 {message.sender.id === myId
			? 'bg-primary/80'
			: 'bg-input'}"
	>
		<!--<Avatar src={cdnUrl(message.sender.id, 'big')} alt={message.sender.username} border={true} />-->

		<div class="flex flex-col gap-1">
			<!--<div class="text-elipsis flex flex-row gap-1 overflow-hidden truncate text-sm">
				<span class="font-bold">{message.sender.username}</span>
			</div>-->
			<span class="whitespace-pre-wrap break-all text-left {message.sender.id === myId
				? 'text-primary-foreground'
				: ''}">{message.content}</span>
			{#if message.image}
				<img
					src={cdnUrl(message.image)}
					alt=""
					class="max-h-[400px] max-w-full overflow-hidden rounded-lg"
				/>
			{/if}
			{#if message.referenced_lynt && message.referenced_lynt.id}
			<div class="max-w-[390px] md:max-w-[600px]">
				<Lynt lyntClick={handleLyntClick} {myId} {...message.referenced_lynt} small={true} />
			</div>
			{/if}
		</div>

		<!--<Badge class="h-6">{message.sender.iq}</Badge>-->
	</div>
</div>
