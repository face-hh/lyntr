<script lang="ts">
	import { Separator } from '@/components/ui/separator';
	import * as Tooltip from '@/components/ui/tooltip';
	import { BarChart2, Heart, MessageCircle, Repeat2, Share2 } from 'lucide-svelte';
	import { Label } from '@/components/ui/label';

	import Avatar from './Avatar.svelte';
	import OutlineButton from './OutlineButton.svelte';

	function getTimeElapsed(date: Date) {
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

	export let postedAt: Date;
	export let verified: boolean;
	export let username: String;
	export let handle: String;
</script>

<div class="flex gap-3 rounded-xl bg-border p-3">
	<Avatar size={10} src="https://github.com/face-hh.png" alt="A profile picture." />

	<div class="flex flex-col max-w-[530px]">
		<div class="flex items-center gap-1">
			<span class="truncate max-w-[50%] text-xl font-bold">{username}</span>
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
				>104</span
			>
			<Label class="truncate max-w-[30%] text-lg text-gray-600">@{handle}</Label>
			<Label class="text-lg text-gray-600">• {getTimeElapsed(postedAt)}</Label>
		</div>

		<Label class="text-lg"
			>Moments like this are why I enjoy programming and game development so much.</Label
		>
		<br />
		<br />
		<Label class="text-lg"
			>You put in hours of focused work and these little wins where stuff works make it all worth
			it!</Label
		>

		<div class="mt-2 flex gap-2">
			<OutlineButton icon={MessageCircle} text="1.3K" colorOnClick={true} />
			<OutlineButton icon={Repeat2} text="334" colorOnClick={true} />
			<OutlineButton icon={Heart} text="41.5K" className="active" colorOnClick={true} />
			<OutlineButton icon={BarChart2} text="1.43M" className="ml-auto" />
			<OutlineButton icon={Share2} />
		</div>
	</div>
</div>
<Separator />
