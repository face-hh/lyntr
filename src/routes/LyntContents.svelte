<script lang="ts">
	import * as Tooltip from '@/components/ui/tooltip';
	import { Label } from '@/components/ui/label';
	import * as HoverCard from '@/components/ui/hover-card/index.js';
    import { readable } from 'svelte/store';
    import { onDestroy } from 'svelte';
	import Avatar from './Avatar.svelte';

	import CalendarDays from 'lucide-svelte/icons/calendar-days';

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

		const options = { year: 'numeric', month: 'long' };
		return date.toLocaleDateString('en-US', options);
	}
	function formatDateTooltip(date: Date | number) {
        date = new Date(date)
		const options = {
			hour: '2-digit',
			minute: '2-digit',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		};
		return `${date.toLocaleTimeString('en-US', options)}`;
	}

	export let username;
	export let verified;
	export let handle;
	export let createdAt;
	export let content;
	export let iq;
	export let userCreatedAt;
	export let includeAvatar = false;

	const formattedDate = formatDateTooltip(createdAt);
</script>

<div class="flex items-start gap-2">
	{#if includeAvatar}
		<a href="/@{handle}">
			<Avatar size={10} src="https://github.com/face-hh.png" alt="A profile picture." />
		</a>
	{/if}

	<div class="flex flex-col text-left">
		<div class="flex items-center gap-1">
			<HoverCard.Root>
				<HoverCard.Trigger
					href="/@{handle}"
					target="_blank"
					rel="noreferrer noopener"
					class="max-w-[50%] truncate rounded-sm text-xl font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
				>
					{username}
				</HoverCard.Trigger>
				<HoverCard.Content class="w-80">
					<div class="flex justify-between space-x-4">
						<Avatar size={10} src="/@{username}" alt="Profile picture." />

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
					href="/@{handle}"
					target="_blank"
					rel="noreferrer noopener"
					class="max-w-[30%] truncate rounded-sm text-lg text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
				>
					@{handle}
				</HoverCard.Trigger>
				<HoverCard.Content class="w-80">
					<div class="flex justify-between space-x-4">
						<Avatar size={10} src="/@{username}" alt="Profile picture." />

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
            <Label class="text-muted-foreground">• </Label>

			<Tooltip.Root>
				<Tooltip.Trigger>
					<Label class="cursor-pointer hover:underline text-lg text-muted-foreground ">{getTimeElapsed(createdAt)}</Label>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>
						{formattedDate}
					</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>

		<span class="whitespace-pre-wrap break-words text-lg">{content}</span>
	</div>
</div>
