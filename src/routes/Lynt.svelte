<script lang="ts">
	import { cdnUrl } from './stores';
	import { Separator } from '@/components/ui/separator';

	import { BarChart2, Heart, ImageUp, MessageCircle, Repeat2, Share2 } from 'lucide-svelte';
	import * as Dialog from '@/components/ui/dialog/index';
	import * as Form from '@/components/ui/form/index';

	import Avatar from './Avatar.svelte';
	import OutlineButton from './OutlineButton.svelte';
	import { toast } from 'svelte-sonner';
	import LyntContents from './LyntContents.svelte';
	import DivInput from './DivInput.svelte';

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
	export let myId: string;
	export let truncateContent: boolean = true;
	export let lyntClick: (id: string) => Promise<void>;
	export let id: string;
	export let content: string;
	export let userId: string;
	export let createdAt: number;
	export let views: number;
	export let bio: string;
	export let reposted: boolean;
	export let likeCount: number;
	// export let likedByFollowed: boolean;
	export let repostCount: number;
	export let commentCount: number;
	export let likedByUser: boolean;
	export let repostedByUser: boolean;
	export let handle: string;
	export let userCreatedAt: number;
	export let username: string;
	export let iq: number;
	export let has_image: boolean;
	export let verified: boolean;
	export let parentId: string | null;
	export let parentContent: string | null;
	export let parentUserBio: string | null;
	export let parentHasImage: boolean | null;
	export let parentUserId: string | null;
	export let parentUserHandle: string | null;
	export let parentUserUsername: string | null;
	export let parentUserVerified: boolean | null;
	export let parentUserIq: number | null;
	export let parentCreatedAt: number | null;
	export let parentUserCreatedAt: number | null;
	export let connect = false;

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
			if (response.status == 429)
				return toast('Woah, slow down! You are being ratelimited. Please try again in a bit.');
			toast(
				`Oh no! Something went wrong while liking the lynt. Error: ${response.status} | ${response.statusText}`
			);
		}
	}

	async function handleLike() {
		// i have no fucking idea whats happening here
		likeCount = likedByUser ? likeCount - 1 : Number(likeCount) + 1;
		likedByUser = !likedByUser;

		const response = await fetch('/api/likelynt', {
			method: 'POST',
			body: JSON.stringify({ lyntId: id })
		});

		if (response.status !== 200) {
			if (response.status == 429)
				return toast('Woah, slow down! You are being ratelimited. Please try again in a bit.');
			toast(
				`Oh no! Something went wrong while liking the lynt. Error: ${response.status} | ${response.statusText}`
			);
		}
	}
	async function openLynt(lyntid: string) {
		lyntClick(lyntid);
	}

	let copied = false;
	let timeoutId: ReturnType<typeof setTimeout>;

	function handleShare() {
		const url = `${window.location.origin}?id=${id}`;
		toast('Link copied to clipboard!');

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
	let image: File | null = null;
	let imagePreview: string | null = null;
	let fileinput: HTMLInputElement;

	const onFileSelected = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			image = target.files[0];
			let reader = new FileReader();
			reader.readAsDataURL(image);
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
		}
	};
	async function handlePost() {
		const formData = new FormData();
		formData.append('content', lynt);
		formData.append('reposted', id);

		if (image) {
			formData.append('image', image, image.name);
		}

		const response = await fetch('api/lynt', {
			method: 'POST',
			body: formData
		});

		if (response.status === 201) {
			openDialog = false;
			toast('Your lynt has been published!');
		} else {
			toast(`Something happened! Error: ${response.status} | ${response.statusText}`);
		}
	}
</script>

<div on:click|stopPropagation={() => openLynt(id)} class="mb-2 w-full text-left">
	<div
		class="flex w-full gap-3 overflow-hidden rounded-xl bg-lynt-foreground p-3 transition-colors hover:bg-border"
	>
		<a href="/@{handle}" class="inline-block max-h-[40px] min-w-[40px]">
			<Avatar size={10} src={cdnUrl(userId, 'small')} alt="A profile picture." />
		</a>

		<div class="flex w-full max-w-[530px] flex-col gap-2">
			<!-- Lynt that actually gets displayed. Main lynt -->
			<LyntContents
				{truncateContent}
				postId={id}
				{bio}
				isAuthor={userId === myId}
				{has_image}
				{username}
				{userId}
				{verified}
				{handle}
				{createdAt}
				{content}
				{iq}
				{userCreatedAt}
			/>

			{#if reposted && parentId}
				<div on:click|stopPropagation={() => openLynt(parentId)}>
					<div class="rounded-lg border-2 border-primary p-4 drop-shadow">
						{#if parentUserHandle}
							<!-- reposted lynt -->
							<LyntContents
								truncateContent={true}
								content={parentContent}
								userId={parentUserId}
								isAuthor={parentUserId === myId}
								bio={parentUserBio}
								postId={parentId}
								has_image={parentHasImage}
								username={parentUserUsername}
								verified={parentUserVerified}
								handle={parentUserHandle}
								createdAt={parentCreatedAt}
								iq={parentUserIq}
								userCreatedAt={parentUserCreatedAt}
								includeAvatar={true}
							/>
						{/if}
					</div>
				</div>
			{/if}
			<div class="mt-2 flex items-center justify-between gap-2 mb-1">
				<div class="flex items-center gap-2">
					<OutlineButton
						icon={MessageCircle}
						text={formatNumber(commentCount)}
						on:click={() => openLynt(id)}
						small={false}
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
								small={false}
							/>
						</Dialog.Trigger>
						<Dialog.Content class="min-w-[20%]">
							<div
								class="flex max-h-[600px] items-start space-x-3 overflow-y-auto overflow-x-hidden"
							>
								<Avatar size={10} src={cdnUrl(myId, 'small')} alt="Your profile picture." />

								<div class="flex-grow">
									<div class="h-full w-full overflow-y-auto">
										<DivInput bind:lynt />

										{#if imagePreview}
											<div class="max-h-[600px] max-w-[400px] overflow-y-auto">
												<img class="" src={imagePreview} alt="Preview" />
											</div>
										{/if}
									</div>
									<button
										on:click={() => {
											fileinput.click();
										}}
									>
										<ImageUp class="upload" />
									</button>

									<input
										style="display:none"
										type="file"
										accept=".jpg, .jpeg, .png, .gif"
										on:change={onFileSelected}
										bind:this={fileinput}
									/>
									<div class="max-h-[300px] overflow-y-auto rounded-md border-2 border-primary p-4">
										<LyntContents
											truncateContent={true}
											{content}
											isAuthor={userId === myId}
											postId={id}
											{bio}
											{has_image}
											{username}
											{verified}
											{handle}
											{createdAt}
											{iq}
											{userId}
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
</div>
{#if connect}
	<div class="relative left-6 h-4 w-0.5 bg-border" />
{:else}
	<Separator />
{/if}
