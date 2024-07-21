<script lang="ts">
	import * as Tooltip from '@/components/ui/tooltip';
	import { Label } from '@/components/ui/label';
	import * as HoverCard from '@/components/ui/hover-card/index.js';
	import Avatar from './Avatar.svelte';

	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	import * as Popover from '@/components/ui/popover';
	import { Button } from '@/components/ui/button';
	import { Ellipsis, Flag, Trash } from 'lucide-svelte';
	import { Input } from '@/components/ui/input';

	function getTimeElapsed(date: Date | string) {
		if (typeof date === 'string') date = new Date(date);

		const now = new Date();
		const elapsed = now.getTime() - date.getTime();
		const seconds = Math.floor(elapsed / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const weeks = Math.floor(days / 7);
		const years = Math.floor(days / 365);

		if (years > 0) return `${years}y`;
		if (weeks > 0) return `${weeks}w`;
		if (days > 0) return `${days}d`;
		if (hours > 0) return `${hours}h`;
		if (minutes > 0) return `${minutes}m`;
		return `${seconds}s`;
	}
	function formatDate(date: Date | number) {
		if (typeof date === 'string') date = new Date(date);

		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long'
		};
		return date.toLocaleDateString('en-US', options);
	}
	function formatDateTooltip(date: Date | number) {
		date = new Date(date);
		const options: Intl.DateTimeFormatOptions = {
			hour: '2-digit',
			minute: '2-digit',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		};
		return `${date.toLocaleTimeString('en-US', options)}`;
	}

	let popoverOpened = false;

	export let username;
	export let userId;
	export let verified;
	export let handle: string;
	export let createdAt;
	export let content;
	export let iq;
	export let bio: string;
	export let userCreatedAt;
	export let includeAvatar = false;
	export let smaller = false;
	export let has_image: boolean;
	export let postId: string;

	const formattedDate = formatDateTooltip(createdAt);
</script>

<div class={`${$$props.class} flex items-start gap-2`}>
	{#if includeAvatar}
		<a href="/@{handle}" class="inline-block max-h-[40px] min-w-[40px]">
			<Avatar
				size={10}
				src={`http://localhost:9000/lyntr/${userId}_small.webp`}
				alt="A profile picture."
			/>
		</a>
	{/if}

	<div class="flex w-full flex-col text-left">
		<div class="flex w-full items-center gap-1">
			<div class="flex flex-grow items-center gap-1 overflow-hidden">
				<HoverCard.Root>
					<HoverCard.Trigger
						rel="noreferrer noopener"
						class="rounded-sm text-xl font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
						href="/@{handle}"
					>
						{username}
					</HoverCard.Trigger>
					<HoverCard.Content class="w-80">
						<div class="flex justify-between space-x-4">
							<Avatar
								size={10}
								src={`http://localhost:9000/lyntr/${userId}_small.webp`}
								alt="Profile picture."
							/>

							<div class="space-y-1">
								<h4 class="text-sm font-semibold">{username}</h4>
								<h4 class="text-sm font-semibold">@{handle}</h4>
								<p class="break-words text-sm">{bio}</p>
								<div class="flex items-center pt-2">
									<CalendarDays class="mr-2 h-4 w-4 opacity-70" />
									<span class="text-xs text-muted-foreground">
										Joined {formatDate(userCreatedAt)}
									</span>
								</div>
							</div>
						</div>
					</HoverCard.Content>
				</HoverCard.Root>

				{#if verified}
					<Tooltip.Root>
						<Tooltip.Trigger
							><img
								class="h-7 w-7"
								src="verified.png"
								alt="This user is verified."
							/></Tooltip.Trigger
						>
						<Tooltip.Content>
							<p>This user is <span class="rounded-xl bg-border p-1">verified</span>.</p>
						</Tooltip.Content>
					</Tooltip.Root>
				{/if}
				<span
					class="py-0.25 flex select-none items-center rounded-xl border border-transparent bg-primary px-1.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>{iq}</span
				>
				<HoverCard.Root>
					<HoverCard.Trigger
						rel="noreferrer noopener"
						class="truncate rounded-sm text-lg text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
						href="/@{handle}"
					>
						@{handle}
					</HoverCard.Trigger>
					<HoverCard.Content class="w-80">
						<div class="flex justify-between space-x-4">
							<Avatar
								size={10}
								src={`http://localhost:9000/lyntr/${userId}_small.webp`}
								alt="Profile picture."
							/>

							<div class="space-y-1">
								<h4 class="text-sm font-semibold">{username}</h4>
								<h4 class="text-sm font-semibold">@{handle}</h4>
								<p class="text-sm">Cybernetically enhanced web apps.</p>
								<div class="flex items-center pt-2">
									<CalendarDays class="mr-2 h-4 w-4 opacity-70" />
									<span class="text-xs text-muted-foreground">
										Joined {formatDate(userCreatedAt)}
									</span>
								</div>
							</div>
						</div>
					</HoverCard.Content>
				</HoverCard.Root>
				<Label class="text-muted-foreground">•</Label>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Label class="cursor-pointer text-lg text-muted-foreground hover:underline "
							>{getTimeElapsed(createdAt)}</Label
						>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>{formattedDate}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
			<div class="flex-shrink-0">
				<Popover.Root bind:open={popoverOpened}>
					<Popover.Trigger asChild let:builder>
						<button {...builder} on:click|stopPropagation={() => (popoverOpened = !popoverOpened)}>
							<Ellipsis />
						</button>
					</Popover.Trigger>
					<Popover.Content class="flex w-50 flex-col gap-2">
							<Button variant="outline"><Flag class="mr-2 h-4 w-4" />Report user</Button>
							<Button variant="outline"><Flag class="mr-2 h-4 w-4" />Report post</Button>
							<Button variant="outline"><Trash class="mr-2 h-4 w-4" />Delete</Button>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>

		<span class="max-w-[490px] whitespace-pre-wrap break-words text-lg">{content}</span>
	</div>
</div>
{#if has_image}
	<img class="avatar mt-2" src="http://localhost:9000/lyntr/{postId}.webp" alt="ok" />
{/if}
