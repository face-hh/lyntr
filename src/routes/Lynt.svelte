<script lang="ts">
	import { cdnUrl } from './stores';
	import { Separator } from '@/components/ui/separator';
	import { page } from '$app/stores';

	import { BarChart2, Heart, ImageUp, MessageCircle, Repeat2, Share2, Copy } from 'lucide-svelte';
	import * as Dialog from '@/components/ui/dialog/index';
	import * as Form from '@/components/ui/form/index';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';

	import VirtualScroll from 'svelte-virtual-scroll-list';

	import LoadingSpinner from './LoadingSpinner.svelte';
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
	export let small = false;

	let openDialog = false;
	let shareSheetOpen = false;
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

	const url = `${$page.url.origin}?id=${id}`;
	const shareData = {
		title: 'Share Lynt',
		text:
			'Found on Lyntr!\r\n' +
			(content.length > 30
				? content.substring(0, 40) + '...' + (has_image ? '\r\nSee the image on Lyntr' : '')
				: content) +
			'\r\n',
		url
	};

	let friendsList: {
		id: string;
		username: string;
		handle: string;
		verified: boolean;
		iq: number;
		unread: number;
	}[] = [];
	let friendListLoaded = false;
	let friendListPage = 1;
	let friendEnd = false;
	let loadingNextFriends = true;
	let sending = false;

	async function handleShare() {
		shareSheetOpen = true;
		if (!friendListLoaded) {
			await appendFriends();
			friendListLoaded = true;
		}
	}

	async function openShare() {
		shareSheetOpen = false;
		if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
			try {
				await navigator.share(shareData);
			} catch (e) {}
		}
	}

	function copyClick() {
		shareSheetOpen = false;
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
		toast('Link copied to clipboard!');
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

	async function appendFriends() {
		if (friendEnd) return;

		loadingNextFriends = true;
		try {
			const response = await fetch(`/api/me/friends?page=${friendListPage}`);

			if (response.status === 200) {
				let { friends, isLast } = await response.json();
				friendEnd = isLast;
				friendsList = [...friendsList, ...friends];
			} else {
				toast('Failed to load more friends: ' + response.status);
				friendEnd = true;
			}
		} catch (error) {
			toast('Failed to load more friends: ');
			friendEnd = true;
		}
		loadingNextFriends = false;
	
	}

	async function sendTo(other_id: string) {
		if (sending) return;

		sending = true;
		const formData = new FormData();
		formData.append('other_id', other_id);
		formData.append('lynt', id);

		try {
                        const response = await fetch('/api/messages/post', {
                                method: 'POST',
                                body: formData
                        });

                        if (response.status !== 200) {
                                toast((await response.json()).error);
                        }
                } catch (error) {
                        toast('error: ' + error);
                }
		sending = false;
		shareSheetOpen = false;
	}
</script>


<Sheet.Root bind:open={shareSheetOpen}>
	<Sheet.Trigger />
	<Sheet.Content side="bottom" class="md:!inset-x-auto md:inset-y-0 md:left-0 md:h-full md:!w-1/3 md:border-r md:border-t-none flex flex-col gap-2 justify-between">
		<div class="flex flex-col gap-2 max-h-1/3 mt-2">
		<Sheet.Header>
			<Sheet.Title>{shareData.title}</Sheet.Title>
		</Sheet.Header>
			{#if !friendListLoaded}
				<LoadingSpinner />
			{:else if friendsList.length > 0}
				<VirtualScroll
					data={friendsList}
					key="id"
					let:data={friend}
					on:bottom={async () => {
						// load next page of friends
						if (loadingNextFriends) return;
						friendListPage += 1;
						await appendFriends();
					}}
				>
					<button
						class="flex w-72 flex-row items-center rounded-full bg-secondary p-1.5 mx-auto mb-1"
						on:click={async () => {
							await sendTo(friend.id);
						}}
					>
						<div class="flex flex-row gap-1 justify-between w-full">
							<Avatar src={cdnUrl(friend.id, 'big')} alt={friend.username} border={true} />
							<div class="text-elipsis overflow-hiddentruncate flex w-full flex-col gap-1 text-sm">
								<span class="font-bold">{friend.username}</span>

								<span class="text-muted-foreground">@{friend.handle}</span>
							</div>
						</div>
					</button>
				</VirtualScroll>
			{:else}
				<span>No Friends</span>
			{/if}

		</div>
		<Sheet.Footer>
			<div class="flex flex-row gap-2 justify-center w-full">
				<Button variant="ghost" on:click={copyClick} class="flex flex-row gap-2">
					<Copy />
					Copy
				</Button>
				<Button variant="ghost" on:click={openShare} class="flex flex-row gap-2">
					<Share2 />
					Other
				</Button>
			</div>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>

<div on:click|stopPropagation={() => openLynt(id)} class="mb-2 w-full text-left">
	<div
		class="flex w-full gap-3 overflow-hidden rounded-xl bg-lynt-foreground p-3 transition-colors hover:bg-border"
	>
		<a href="/@{handle}" class="inline-block max-h-[40px] min-w-[40px]">
			<Avatar size={10} src={cdnUrl(userId, 'small')} alt="A profile picture." />
		</a>

		<div class="flex w-full max-w-[530px] flex-col gap-2 min-w-0">
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
				smaller={small}
				on:delete
			/>

			{#if reposted && parentId}
				<div on:click|stopPropagation={() => openLynt(parentId)}>

					<div class="rounded-lg border-2 border-primary p-4 drop-shadow max-w-full overflow-x-hidden max-w-[350px]">

					

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
								smaller={small}
								{reposted}
								includeAvatar={true}
								on:delete
							/>
						{/if}
					</div>
				</div>
			{/if}
			<div class="mb-1 mt-2 flex items-center justify-between gap-2">
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
											on:delete
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
