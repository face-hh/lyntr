<script lang="ts">
	import { Separator } from '@/components/ui/separator';

	import { BarChart2, Heart, MessageCircle, Repeat2, Share2 } from 'lucide-svelte';
	import * as Dialog from '@/components/ui/dialog/index';
	import * as Form from '@/components/ui/form/index';

	import Avatar from './Avatar.svelte';
	import OutlineButton from './OutlineButton.svelte';
	import { toast } from 'svelte-sonner';
	import LyntContents from './LyntContents.svelte';

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
	export let lyntClick: Function;
	export let id: string;
	export let content: string;
	export let userId: string;
	export let createdAt: number;
	export let views: number;
	export let reposted: boolean;
	export let likeCount: number;
	export let likedByFollowed: boolean;
	export let repostCount: number;
	export let commentCount: number;
	export let likedByUser: boolean;
	export let repostedByUser: boolean;
	export let handle: string;
	export let userCreatedAt: number;
	export let username: string;
	export let iq: number;
	export let verified: boolean;
	export let parentId: string | null;
	export let parentContent: string | null;
	export let parentUserHandle: string | null;
	export let parentUserUsername: string | null;
	export let parentUserVerified: boolean | null;
	export let parentUserIq: number | null;
	export let parentCreatedAt: number | null;
	export let parentUserCreatedAt: number | null;

	let openDialog = false;
	let lynt = '';


	async function handleRepost() {
		if (repostedByUser) return;
		openDialog = !openDialog;

		const response = await fetch('/api/likelynt', {
			method: 'POST',
			body: JSON.stringify({ lyntId: id })
		});

		if (response.status !== 200) {
			toast(
				`Oh no! Something went wrong while liking the lynt. Error: ${response.status} | ${response.statusText}`
			);
		}
	}

	async function handlePost() {
		const response = await fetch('api/lynt', {
			method: 'POST',
			body: JSON.stringify({
				content: lynt,
				reposted: id
			})
		});

		if (response.status === 201) {
			openDialog = false;
			toast('Your lynt has been published!');
		} else {
			toast(`Something happened! Error: ${response.status} | ${response.statusText}`);
		}
	}

	async function handleLike() {
		// i have no fucking idea whats happening here
		likeCount = likedByUser ? likeCount - 1 : parseInt(likeCount) + 1;
		likedByUser = !likedByUser;

		const response = await fetch('/api/likelynt', {
			method: 'POST',
			body: JSON.stringify({ lyntId: id })
		});

		if (response.status !== 200) {
			toast(
				`Oh no! Something went wrong while liking the lynt. Error: ${response.status} | ${response.statusText}`
			);
		}
	}
	async function openLynt(lyntid: string) {
		console.log(lyntid)
		lyntClick(lyntid);
	}

	let copied = false;
	let timeoutId: ReturnType<typeof setTimeout>;

	function handleShare() {
		const url = `${window.location.origin}?id=${id}`;
		toast('Link copied to clipboard!' + url);

		navigator.clipboard
			.writeText(url)
			.then(() => {
				copied = true;
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					copied = false;
				}, 300);
			})
			.catch((err) => {
				console.error('Failed to copy: ', err);
			});
	}
</script>

<button on:click={() => openLynt(id)} class="w-full text-left">
	<div
		class="flex min-w-[570px] gap-3 rounded-xl bg-lynt-foreground p-3 transition-colors hover:bg-border"
	>
		<a href="/@{handle}" class="inline-block max-h-[40px] min-w-[40px]">
			<Avatar size={10} src="https://github.com/face-hh.png" alt="A profile picture." />
		</a>

		<div class="flex w-full max-w-[530px] flex-col gap-2">
			<LyntContents {username} {verified} {handle} {createdAt} {content} {iq} {userCreatedAt} />
			<!-- <img
				class="rounded-lg"
				src="https://pbs.twimg.com/media/GSceuhPWsAAM60r?format=jpg&name=4096x4096"
				alt="ok"
			/> -->
			{#if reposted && parentId}
				<button on:click|stopPropagation={() => openLynt(parentId)}>
					<div class="rounded-lg border-2 border-primary p-4 drop-shadow">
						<LyntContents
							username={parentUserUsername}
							verified={parentUserVerified}
							handle={parentUserHandle}
							createdAt={parentCreatedAt}
							content={parentContent}
							iq={parentUserIq}
							userCreatedAt={parentUserCreatedAt}
							includeAvatar={true}
						/>
					</div>
				</button>
			{/if}
			<div class="mt-2 flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<OutlineButton
						icon={MessageCircle}
						text={formatNumber(commentCount)}
						on:click={() => openLynt(id)}
					/>

					<Dialog.Root bind:open={openDialog}>
						<Dialog.Trigger let:builder>
							<OutlineButton
								{...builder}
								on:click={handleRepost}
								isActive={repostedByUser}
								icon={Repeat2}
								text={formatNumber(repostCount)}
								outline={true}
							/>
						</Dialog.Trigger>
						<Dialog.Content class="sm:max-w-[425px]">
							<div class="flex items-start space-x-3">
								<Avatar
									size={10}
									src="https://github.com/face-hh.png"
									alt="Your profile picture."
								/>

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
									<div class="rounded-md border-2 border-primary p-4">
										<LyntContents
											{username}
											{verified}
											{handle}
											{createdAt}
											{content}
											{iq}
											{userCreatedAt}
											includeAvatar={true}
											smaller={true}
										/>
									</div>
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
						outline={true}
					/>
				</div>
				<div class="ml-auto flex items-center gap-2">
					<OutlineButton
						icon={BarChart2}
						popover={"The times this post has been shown in someone's feed."}
						text={formatNumber(views)}
						outline={true}
					/>
					<OutlineButton icon={Share2} on:click={handleShare} animate={copied} />
				</div>
			</div>
		</div>
	</div>
</button>
<Separator />
