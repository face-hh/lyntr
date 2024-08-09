<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { ImageUp, Moon, Reply, Sun, X } from 'lucide-svelte';

	import { cdnUrl, v } from './stores';
	import { source } from 'sveltekit-sse';

	import Lynt from './Lynt.svelte';
	import Navigation from './Navigation.svelte';
	import PostButton from './PostButton.svelte';
	import ProfileButton from './ProfileButton.svelte';
	import { toggleMode } from 'mode-watcher';
	import { onDestroy, onMount } from 'svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { toast } from 'svelte-sonner';
	import { currentPage } from './stores';
	import Search from './Search.svelte';
	import Notifications from './Notifications.svelte';
	import ProfilePage from './ProfilePage.svelte';
	import MessagesPage from './MessagesPage.svelte';
	import { goto } from '$app/navigation';
	import TopTab from './TopTab.svelte';
	import DivInput from './DivInput.svelte';
	import type { FeedItem } from './stores';

	export let username: string;
	export let handle: string;
	// export let created_at: string;
	// export let iq: number;
	export let id: string;
	export let otherId: string | null = null;
	export let lyntOpened: string | null = null;
	export let profileOpened: string | null = null;

	let comment: string;
	let postCommentDisabled: boolean = true;
	let loadingFeed = true;

	let page: string = 'home';
	currentPage.subscribe((value) => {
		page = value;
	});

	let feed: FeedItem[] = [];
	let comments: FeedItem[] = [];
	let selectedLynt: FeedItem | null = null;
	let referencedLynts: FeedItem[] = [];
	let loadingComments = false;

	let currentTab = 'For you';
	const tabs = ['For you', 'Following', 'New'];

	let eventSource: EventSource | undefined = undefined;

	function handleTabChange(tab: string) {
		currentTab = tab;
		fetchFeed();

		if (eventSource) {
			eventSource.close();
		}
		if (currentTab === tabs[2]) {
			eventSource = new EventSource('/api/sse');
			eventSource.onmessage = async (event) => {
				const data = JSON.parse(event.data);
				if (data.type === 'lynt_add') {
					await renderLyntAtTop(data.data);
				}
			};
		}
	}

	let feedContainer: HTMLDivElement;

	let loadingBottomFeed = false;

	function handleScroll() {
		if (feedContainer) {
			const { scrollTop, scrollHeight, clientHeight } = feedContainer;

			if (scrollTop + clientHeight >= scrollHeight - 5 && !loadingBottomFeed) {
				loadingBottomFeed = true;

				fetchFeed(true).then(() => {
					loadingBottomFeed = false;
				});
			}
		}
	}

	if (lyntOpened !== null && lyntOpened !== '') {
		(async () => {
			selectedLynt = await getLynt(lyntOpened);

			comments = await getComments(lyntOpened);
		})();
	} else if (profileOpened !== null) {
		page = `profile${profileOpened}`;
	} else if (otherId !== null) {
		page = `messages/${otherId}`;
	}

	async function getLynt(lyntOpened: string) {
		const response = await fetch('/api/lynt?id=' + lyntOpened, { method: 'GET' });

		if (response.status !== 200) toast('Error loading lynt!');

		const res = await response.json();

		referencedLynts = res.referencedLynts || [];

		return res as FeedItem;
	}

	async function fetchFeed(append = false) {
		const response = await fetch(
			`/api/feed?type=${currentTab}&excludePosts=${feed.map((post: any) => post.id).join(',')}`,
			{ method: 'GET' }
		);

		if (response.status !== 200) {
			console.log(currentTab);
			toast('Error generating feed! Please refresh the page');
			return;
		}

		const res = await response.json();
		const newPosts = res.lynts.map((post: any) => ({ ...post }));

		if (append) {
			const uniqueNewPosts = newPosts.filter(
				(newPost: any) => !feed.some((existingPost: any) => existingPost.id === newPost.id)
			);

			feed = feed.concat(uniqueNewPosts);

			if (feed.length > 250) {
				feed = feed.slice(50);
			}
		} else {
			feed = newPosts;
		}

		loadingFeed = false;
	}

	function updateURL(newPath: string) {
		goto(newPath, { replaceState: true, noScroll: true });
	}

	async function handleLyntClick(id: string) {
		loadingComments = true;

		lyntOpened = id;
		referencedLynts = [];
		selectedLynt = feed.find((lynt) => lynt.id === lyntOpened) || (await getLynt(lyntOpened));

		comments = await getComments(lyntOpened);
		loadingComments = false;
		if (!page.startsWith('profile')) updateURL(`/?id=${id}`);
	}

	async function getComments(id: string) {
		const response = await fetch('/api/comments?id=' + id, {
			method: 'GET'
		});

		if (response.status !== 200) {
			toast(`Failed to load comments! Error: ${response.status} | ${response.statusText}`);
		}

		const res = await response.json();
		return res.map((post: any) => ({ ...post }));
	}

	let image: File | null = null;
	let imagePreview: string | null = null;
	let fileInput: HTMLInputElement;

	const onFileSelected = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			image = target.files[0];
			let reader = new FileReader();
			reader.readAsDataURL(image);
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};

			postCommentDisabled = false;
		}
	};

	async function postComment() {

		if (comment.trim() == '' && image == null) {
			toast("Cannot post an empty comment.");
			return;
		}

		const formData = new FormData();
		formData.append('id', selectedLynt?.id ?? '');
		formData.append('content', comment);

		if (image) {
			formData.append('image', image, image.name);
		}

		const response = await fetch('/api/comment', {
			method: "POST",
			body: formData
		});

		image = null;
		imagePreview = null;
		comment = '';
		postCommentDisabled = true;

		if (response.status !== 201) {
			if (response.status == 429)
				return toast('Woah, slow down! You are being ratelimited. Please try again in a bit.');
			toast(
				`Something went wrong while commenting on this lynt. Error: ${response.status} | ${response.statusText}`
			);
		} else {
			toast('Your reply has been posted!');
			comments = [(await response.json()) as FeedItem, ...comments];
			selectedLynt.commentCount = parseInt(selectedLynt.commentCount) + 1;
			selectedLynt = selectedLynt;
		}
	}

	onMount(async () => {
		fetchFeed();

		if (feedContainer) {
			feedContainer.addEventListener('scroll', handleScroll);
		}
	});

	onDestroy(() => {
		if (feedContainer) {
			feedContainer.removeEventListener('scroll', handleScroll);
		}
	});

	async function renderLyntAtTop(lyntId: string) {
		const lynt = await getLynt(lyntId);
		feed = [lynt].concat(feed);
	}

	function goHome() 
	{
		currentPage.set('home');
		goto('/');
	}


	function handleInput(event: Event) {
		if (comment.trim() == '' && image == null) {
			postCommentDisabled = true;
		} else {
			postCommentDisabled = false;
		}
	}

	function getStats(){
		if(!selectedLynt) return "💬 0   🔁 0   ❤️ 0   👁️ 0"

		return `💬 ${selectedLynt.commentCount.toLocaleString()}   🔁 ${selectedLynt.repostCount.toLocaleString()}   ❤️ ${selectedLynt.likeCount.toLocaleString()}   👁️ ${selectedLynt.views.toLocaleString()}`
	}

</script>

<div class="flex w-full justify-center">
	<div class="w-full max-w-[1400px]">
		<div
			class="flex h-dvh w-full flex-col-reverse justify-end gap-4 overflow-hidden pb-20 md:flex-row md:pb-0"
		>
			<div class="fixed inset-x-0 bottom-0 z-50 flex flex-col md:static md:flex-row">
				<div
					class="md:max-w-1/3 flex w-full min-w-full flex-row items-start gap-2 px-2 py-2 md:w-auto md:flex-col md:pt-0"
				>
					<button class="mt-5 hidden md:block" on:click={goHome}>
						<img class="mb-5 size-20 cursor-pointer" src="/logo.svg" alt="Logo" />
					</button>
					<Navigation {handle} {id} />
					<div class="hidden md:flex md:w-full">
						<PostButton userId={id} />
						<ProfileButton src={cdnUrl(id, 'medium')} name={username} handle="@{handle}" />
					</div>
				</div>
				<Separator class="h-[1px] w-full md:h-full md:w-[1px]" />
			</div>

			<div class="flex h-full w-full flex-col items-center gap-1 md:flex-row md:items-start">
				<div
					class="flex h-full w-full {page.startsWith('messages')
						? ''
						: 'max-w-[600px]'} flex-col overflow-hidden md:px-1 {lyntOpened && selectedLynt
						? 'hidden md:flex'
						: ''}"
				>
					{#if page === 'search'}
						<Search userId={id} {handleLyntClick} myHandle={handle} />
					{:else if page === 'notifications'}
						<Notifications {handleLyntClick} />
					{:else if page.startsWith('messages')}
						<MessagesPage myId={id} profileHandle={page.split('/')[1]} {handleLyntClick} {getLynt} myHandle={handle} />
					{:else if page.startsWith('profile')}
						{#key page}
							<ProfilePage
								myId={id}
								profileHandle={page.replace('profile', '')}
								{handleLyntClick}
							/>
						{/key}
					{:else if page === 'home'}
						<div class="min-w-1/3 mt-5 flex h-full flex-col md:px-1">
							<TopTab {tabs} {currentTab} onTabChange={handleTabChange} />
							<Separator class="mt-4" />

							<!-- Feed -->
							<div
								class="flex h-full w-full flex-col gap-2 overflow-y-auto px-1 py-2"
								bind:this={feedContainer}
							>
								{#if loadingFeed}
									<LoadingSpinner />
								{:else}
									{#each feed as lynt}
										<Lynt {...lynt} myId={id} lyntClick={handleLyntClick} on:delete={({ detail: { id } }) => {
	feed = feed.filter((item) => item.id !== id);
}} />
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>
				{#if lyntOpened && selectedLynt}
					<div class="mb-2 h-full w-full max-w-[530px] pb-10">
						<button
							class="flex w-full justify-end p-2 md:justify-start"
							on:click={() => {
								if (selectedLynt && selectedLynt.parentId && !selectedLynt.reposted) {
									handleLyntClick(selectedLynt.parentId);
								} else {
									lyntOpened = null;
									selectedLynt = null;
								}
							}}><X /></button
						>
						<div
							class="md:min-w-1/2 mx-auto flex h-full max-w-[600px] flex-col gap-2 overflow-y-auto overflow-x-hidden px-1 md:mx-0"
							id="lynt-container"
						>
							<!-- Referenced Lynts -->
							<div class="w-full">
								{#each referencedLynts as lynt (lynt.id)}
									<Lynt {...lynt} myId={id} lyntClick={handleLyntClick} connect={true} />
								{/each}
							</div>

							<!-- Selected Lynt -->
							<div class="w-full" id="selected-lynt">
								<Lynt
									{...selectedLynt}
									myId={id}
									truncateContent={false}
									lyntClick={handleLyntClick}
									on:delete={() => updateURL('/')}
								/>
							</div>

							<div class="flex w-full flex-col gap-2 rounded-xl bg-border p-3">
								<div class="flex w-full items-center gap-2">
									<Reply size={32} />
	
									<!--<div
										contenteditable="true"
										role="textbox"
										spellcheck="true"
										tabindex="0"
										bind:textContent={comment}
										class="overflow-wrap-anywhere w-full text-lg outline-none"
										placeholder="Reply..."
										on:paste={handlePaste}
										on:input={handleInput}
									/>-->
									<DivInput placeholder="Reply..." class="overflow-wrap-anywhere w-full text-lg outline-none" bind:lynt={comment} on:input={handleInput} />

									<button
										on:click={() => {
											fileInput.click();
										}}>
										<ImageUp class="h-auto"/>
									</button>
	
									<input
										style="display:none"
										type="file"
										accept=".jpg, .jpeg, .png, .gif"
										on:change={onFileSelected}
										bind:this={fileInput}/>

									<Button on:click={postComment} disabled={postCommentDisabled}>Post</Button>
								</div>

								{#if imagePreview}
										<img class="max-h-[600px] w-full object-contain" src={imagePreview} alt="Preview" />
								{/if}
							</div>
							<Separator />
							{#if loadingComments}
								<LoadingSpinner occupy_screen={false} />
							{:else if comments.length === 0}
								<Label class="flex justify-center text-lg">This lynt has no comments.</Label>
							{:else}
								{#each comments as lynt}
									<Lynt {...lynt} myId={id} lyntClick={handleLyntClick} on:delete={({ detail: { id } }) => {
	comments = comments.filter((item) => item.id !== id);
}} />
								{/each}
							{/if}
							<div class="flex h-full w-full flex-col gap-2 overflow-y-auto"></div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<svelte:head>
	{#if page === 'home'}
		{#if selectedLynt}
			<title>{selectedLynt.username} on Lyntr: "{selectedLynt.content}"</title>
		{:else}
			<title>Lyntr</title>
		{/if}
	{/if}
</svelte:head>
