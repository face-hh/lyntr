<script lang="ts">
	import { Separator } from '@/components/ui/separator';
	import * as Tooltip from '@/components/ui/tooltip';
	import { BarChart2, Heart, MessageCircle, Repeat2, Share2 } from 'lucide-svelte';
	import { Label } from '@/components/ui/label';
	import * as Dialog from '@/components/ui/dialog/index';
	import * as Form from '@/components/ui/form/index';

	import Avatar from './Avatar.svelte';
	import OutlineButton from './OutlineButton.svelte';
	import { toast } from 'svelte-sonner';

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
	function formatNumber(num: number): string {
		if (!num) return '0';

		const absNum = Math.abs(num);

		if (absNum >= 1000000000) {
			return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
		}
		if (absNum >= 1000000) {
			return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
		}
		if (absNum >= 1000) {
			return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
		}
		return num.toString();
	}

	export let id: string;
	export let postedAt: Date;
	export let verified: boolean;
	export let username: String;
	export let handle: String;
	export let content: String;
	export let iq: number;
	export let commentCount: number;
	export let repostCount: number;
	export let likeCount: number;
	export let viewsCount: number;
	export let likedByUser: boolean;
	export let repostedByUser: boolean;

	let openDialog = false;
	let lynt = '';

	async function handleRepost() {
		if (repostedByUser) return;
		openDialog = true
		const response = await fetch('/api/likelynt', {
			method: 'POST',
			body: JSON.stringify({ lyntId: id })
		});

		if (response.status !== 200) {
			toast(
				`Oh no! Something went wrong while liking the tweet. Error: ${response.status} | ${response.statusText}`
			);
		}
	}

	async function handlePost(){

	}
	
	async function handleLike() {
		// i have no fucking idea whats happening here
		likeCount = likedByUser ? likeCount - 1 : parseInt(likeCount) + 1;
		console.log(likeCount);
		likedByUser = !likedByUser;

		const response = await fetch('/api/likelynt', {
			method: 'POST',
			body: JSON.stringify({ lyntId: id })
		});

		if (response.status !== 200) {
			toast(
				`Oh no! Something went wrong while liking the tweet. Error: ${response.status} | ${response.statusText}`
			);
		}
	}
</script>

<div class="flex gap-3 rounded-xl bg-border p-3">
	<Avatar size={10} src="https://github.com/face-hh.png" alt="A profile picture." />

	<div class="flex w-full max-w-[530px] flex-col">
		<div class="flex items-center gap-1">
			<span class="max-w-[50%] truncate text-xl font-bold">{username}</span>
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
			<Label class="max-w-[30%] truncate text-lg text-gray-600">@{handle}</Label>
			<Label class="text-lg text-gray-600">• {getTimeElapsed(postedAt)}</Label>
		</div>

		<span class="whitespace-pre-wrap break-words text-lg">{content}</span>

		<div class="mt-2 flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<OutlineButton icon={MessageCircle} text={formatNumber(commentCount)} />

				<Dialog.Root open={openDialog}>
					<Dialog.Trigger let:builder>
						<OutlineButton
						{...builder}
							on:click={handleRepost}
							isActive={repostedByUser}
							icon={Repeat2}
							text={formatNumber(repostCount)}
						/>
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<div class="flex items-start space-x-3">
							<Avatar size={10} src="https://github.com/face-hh.png" alt="Your profile picture." />

							<div class="flex-grow">
								<div
									contenteditable="true"
									role="textbox"
									spellcheck="true"
									tabindex="0"
									bind:textContent={lynt}
									class="overflow-wrap-anywhere min-h-[80px] w-full outline-none"
									placeholder="What's happening?"
								/>
							</div>
						</div>

						<div class="flex justify-end">
							<Form.Button on:click={handlePost}>Post</Form.Button>
						</div>
					</Dialog.Content>
				</Dialog.Root>

				<OutlineButton
					on:click={handleLike}
					isActive={likedByUser}
					icon={Heart}
					text={formatNumber(likeCount)}
					colorOnClick={true}
				/>
			</div>
			<div class="ml-auto flex items-center gap-2">
				<OutlineButton
					icon={BarChart2}
					popover={"The times this post has been shown in someone's feed."}
					text={formatNumber(viewsCount)}
				/>
				<OutlineButton icon={Share2} />
			</div>
		</div>
	</div>
</div>
<Separator />
