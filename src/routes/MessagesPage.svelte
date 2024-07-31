<script lang="ts" context="module">
	export type SimpleUser = {
		id: string;
		username: string;
		handle: string;
		iq: number;
		verified: boolean;
	};

	export type Message = {
		id: number;
		sender: SimpleUser;
		receiver: SimpleUser;
		content: string;
		created_at: string;
		image: string | null;
		read: boolean;
	};
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { cdnUrl, currentPage } from './stores';
	import { toast } from 'svelte-sonner';
	import Avatar from './Avatar.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	//import { Input } from '$lib/components/ui/input';
	import { Textarea } from "$lib/components/ui/textarea";
	import { Button } from '$lib/components/ui/button';
	import { Send, MoveDown, Image, X } from 'lucide-svelte';
	import VirtualScroll from 'svelte-virtual-scroll-list';
	import * as Tooltip from '@/components/ui/tooltip';
	import { mode } from 'mode-watcher';
	import MessageComponent from './Message.svelte';
	import { Separator } from "$lib/components/ui/separator";

	export let profileHandle: string;
	export let handleLyntClick;
	export let myId: string;
	export let isSelf: boolean = false;
	export let loading: boolean = true;

	let messageValue: string = '';

	let profile: {
		username: string;
		handle: string;
		iq: number;
		created_at: string;
		id: string;
		following: number;
		followers: number;
		bio: string;
		verified: boolean;
	};

	let messages: Message[] = [];
	let messagesContainer: VirtualScroll;
	let messagesLoading = false;

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
	let unreadMessageI = -1;

	let image: File | null = null;
	let imagePreview: string | null = null;
        let fileinput: HTMLInputElement;

	let textarea: any;

	$: messages &&
		(async () => {
			const i = friendsList.findIndex((friend) => friend.id === profile.id);
			if (i >= 0 && friendsList[i]) {
				friendsList[i].unread = messages.filter(
					(msg) => msg.sender.id !== myId && !msg.read
				).length;
			}
			if (messagesContainer) {
				await tick();
				messagesContainer.scrollToBottom();
			}
		})();

	$: {
		const msgs = messages.filter((m) => m.sender.id !== myId);
		const friend = friendsList[friendsList.findIndex((friend) => friend.id === profile.id)];

		unreadMessageI = messages.findIndex((msg) => {
			if (!friend || msgs.length === 0 || msgs.length - friend.unread < 0) {
				return false;
			}
			return msg.id === msgs[msgs.length - friend.unread]?.id;
		});
	}

	async function markAsRead() {
		if (unreadMessageI < 0) return;

		for (let i = unreadMessageI; i < messages.length; i++) {
			if (messages[i] && messages[i].sender.id !== myId) {
				messages[i].read = true;
			}
		}
		unreadMessageI = -1;

		// TODO: mark messages as read in database
	}

	async function fetchProfile() {
		if (!profileHandle) return;

		try {
			const response = await fetch(`/api/profile?handle=${profileHandle}`);

			if (response.status === 200) {
				profile = await response.json();
				isSelf = profile.id === myId;
			} else {
				toast(
					`Failed to load profile. Error: ${response.status} ${JSON.stringify(await response.json())}`
				);
			}
		} catch (error) {
			if (isSelf) return;
			console.error('Error fetching profile:', error);
			toast('Failed to load profile: ' + error);
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

	onMount(async () => {
		messagesLoading = true;

		await Promise.all([fetchProfile(), appendFriends()]);
		friendListLoaded = true;
		loading = false;

		try {
			const response = await fetch('/api/messages?other_id=' + profile.id);
			if (response.status !== 200) {
				toast("failed to get messages");
			} else {
				messages = (await response.json()).messages || [];
			}
		} catch (error) {
			toast("failed to get messages: " + error);
		}

		messagesLoading = false;
	});

	async function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && event.shiftKey) {
			await sendMessage();
		}
	}

	async function sendMessage() {
		if (messageValue.trim() === '' && (imagePreview === null || fileinput.value === "")) return;

		const formData = new FormData();
		if (image !== null) {
			formData.append('image', fileinput.files[0]);
		}
		formData.append('other_id', profile.id);
		formData.append('content', messageValue);

		messageValue = '';
		imagePreview = null;
                fileinput.value = "";
                image = null;

		messages = [
			...messages,
			(await (await fetch('/api/messages/post', {
				method: 'POST',
				body: formData
			})).json()).message
		];


		await tick();
		textarea.style.height = "1px";
		textarea.style.height = (4+textarea.scrollHeight)+"px"
	}

	async function preappendPreviousMessages() {
		messagesLoading = true;


		messagesLoading = false;
	}

	async function handleFocus() {
		await markAsRead();
	}

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
</script>

{#if loading}
	<LoadingSpinner />
{:else if isSelf}
	<span>You can't private message with your self</span>
{:else if profile}
	<div class="relative flex h-full w-full flex-row gap-1">
		<div class="hidden h-full w-full flex-col items-center gap-1 md:flex md:w-[300px]">
			<span class="my-2 text-xl">Messages</span>
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
						class="flex flex-row items-center justify-center gap-2 rounded-full bg-secondary p-1.5 {profile.id ===
						friend.id
							? 'bg-secondary/50'
							: ''}"
						on:click={() => {
							currentPage.set('messages/@' + friend.handle);

							goto('/messages/@' + friend.handle, {
								replaceState: true,

								noScroll: true
							});
						}}
					>
						<div class="flex flex-row items-center gap-1">
							<Avatar src={cdnUrl(friend.id, 'big')} alt={friend.username} border={true} />
							<div class="text-elipsis flex w-full flex-col gap-1 overflow-hidden truncate text-sm">
								<span class="font-bold">{friend.username}</span>
								<span class="text-muted-foreground">@{friend.handle}</span>
							</div>
						</div>
						<Badge>{friend.unread || 0}</Badge>
					</button>
				</VirtualScroll>
			{:else}
				<span>No Messages</span>
			{/if}
		</div>
		<Separator orientation="vertical" class="hidden md:block" />
		<div class="mt-2 flex w-full flex-col gap-2 px-1">
			<!--<span class="text-2xl text-center py-2">Private Messages With {profile.username}</span>-->
			<div
				class="flex w-full flex-row items-center justify-between gap-2 rounded-md bg-secondary/50 p-2"
			>
				<div class="flex flex-row gap-2">
					<Avatar src={cdnUrl(profile.id, 'big')} alt={profile.username} border={true} />
					<div class="flex flex-col">
						<div class="flex flex-row gap-2">
							<span class="text-lg font-bold">{profile.username}</span>
							{#if profile.verified}
								<Tooltip.Root>
									<Tooltip.Trigger>
										<div class="flex h-full w-7 justify-center">
											<img
												class="h-7 w-7"
												src={$mode !== 'light' ? '/white_mode_verified.png' : '/verified.png'}
												alt="This user is verified."
											/>
										</div>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>This user is <span class="rounded-xl bg-border p-1">verified</span>.</p>
									</Tooltip.Content>
								</Tooltip.Root>
							{/if}
							<span class="text-lg text-muted-foreground">@{profile.handle}</span>
						</div>
						<span class="w-full max-w-full overflow-hidden truncate text-ellipsis"
							>{profile.bio}</span
						>
					</div>
				</div>
				<Badge>{profile.iq}</Badge>
			</div>
			<div
				class="messagesContainer relative flex h-full w-full flex-col justify-end overflow-hidden rounded-md px-1 py-2"
			>
				<VirtualScroll
					bind:this={messagesContainer}
					data={messages}
					key="id"
					on:top={preappendPreviousMessages}
					let:data={item}
				>
					<MessageComponent
						message={item}
						{unreadMessageI}
						index={messages.findIndex((msg) => msg.id === item.id)}
						unreadCount={friendsList[friendsList.findIndex((friend) => friend.id === profile.id)]
							?.unread || 0}
						{handleLyntClick}
						{myId}
					/>
				</VirtualScroll>
				{#if messagesLoading}
					<LoadingSpinner />
				{/if}

				<!--<Button class="absolute right-2 bottom-2 rounded-md p-2 aspect-square" on:click={() => {
					messagesContainer.scrollToBottom();
					markAsRead();
				}}>
					<MoveDown/>
				</Button>-->
			</div>
			<div class="p-2 bg-input rounded-t-lg w-full h-72" class:hidden={!imagePreview}>
				<div class="relative bg-no-repeat w-full h-full bg-center bg-contain" style:background-image={`url(${imagePreview})`}>
					<Button variant="ghost" class="absolute top-0 right-2 w-16 h-16" on:click={() => {
						imagePreview = null;
				                fileinput.value = "";
					        image = null;
					}}><X/></Button>
				</div>
			</div>
			<div class="mb-1 mt-2 flex flex-row gap-1 items-center rounded-xl p-1 bg-secondary text-secondary-foreground">
				<Button variant="ghost" class="aspect-square p-1 w-[41px] h-[41px]" on:click={() => fileinput.click()}>
					<Image />
				</Button>
				<Textarea
					bind:ref={textarea}
					class="resize-none w-full min-h-min max-h-32 h-[41px] border-none bg-transparent"
					placeholder="Message @{profile.handle}"
					bind:value={messageValue}
					on:keydown={handleKeyPress}
					on:focus={handleFocus}
					on:keyup={(e) => {
						/** 
						 * @type {HTMLTextaAreaElement} 
						 **/
						const el = e.target;
						if (el) {
                        	el.style.height = "1px";
						    el.style.height = (4+el.scrollHeight)+"px";
						}
					}}
				/>
				<Button variant="ghost" class="aspect-square p-1 w-[41px] h-[41px]" on:click={sendMessage}>
					<Send />
				</Button>
				<input
                                        style="display:none"
                                        type="file"
                                        accept=".jpg, .jpeg, .png"
                                        on:change={onFileSelected}
                                        bind:this={fileinput}
                                />
			</div>
		</div>
	</div>
{:else}
	<span>Invalid Profile</span>
{/if}
