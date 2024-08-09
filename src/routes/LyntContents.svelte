<script lang="ts">
	import * as Tooltip from '@/components/ui/tooltip';
	import { Label } from '@/components/ui/label';
	import * as HoverCard from '@/components/ui/hover-card/index.js';
	import * as AlertDialog from '@/components/ui/alert-dialog';
	import Avatar from './Avatar.svelte';
	import { mode } from 'mode-watcher';
	import { cdnUrl } from './stores';

	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	import * as Popover from '@/components/ui/popover';
	import { Ellipsis, Trash, Copy } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import Report from './Report.svelte';
	import DOMPurify from 'dompurify';
	import { page } from '$app/stores';
	import { Button } from '@/components/ui/button';

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
	function formatDate(date) {
		if (typeof date === 'string') date = new Date(date);

		const options = {
			year: 'numeric',
			month: 'long'
		};
		return date.toLocaleDateString(undefined, options);
	}

	function formatDateTooltip(date) {
		date = new Date(date);

		const options = {
			hour: '2-digit',
			minute: '2-digit',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		};

		return date.toLocaleString(undefined, options);
	}

	let popoverOpened = false;

	export let truncateContent: boolean = false;
	export let username;
	export let userId;
	export let verified;
	export let handle: string;
	export let createdAt;
	export let content: string | null;
	export let iq;
	export let bio: string | null;
	export let smaller = false;
	export let userCreatedAt;
	export let includeAvatar = false;
	export let isAuthor: boolean;
	export let has_image: boolean | null;
	export let postId: string;
	let contentElement: HTMLSpanElement | null = null;
	content = content!;
	let clickingExternalLink = false;
	let externalLink: URL | null = null;

	const formattedDate = formatDateTooltip(createdAt);

	async function handleDelete() {
		const response = await fetch('api/lynt?id=' + postId, { method: 'DELETE' });

		if (response.status === 200) {
			toast(`Your post has been permanently deleted.`);
		} else if (response.status === 403) {
			toast(`Missing access - frontend may be desynchronised.`);
		} else {
			toast(`Unknown error occured while deleting: ${response.status} | ${response.statusText}`);
		}
	}

	function handleCopy() {
		toast('Link copied to clipboard!');
		navigator.clipboard.writeText(content)
	}

	function truncateContentFunc(
		content: string,
		maxLines: number = 5
	): { truncated: string; needsReadMore: boolean } {
		const lines = content.split('\n');

		if (lines.length <= maxLines || !truncateContent) {
			return { truncated: content, needsReadMore: false };
		}
		return {
			truncated: lines.slice(0, maxLines).join('\n'),
			needsReadMore: true
		};
	}

	$: ({ truncated, needsReadMore } = truncateContentFunc(content));

	$: if (contentElement) {
		const sanitizedContent = DOMPurify.sanitize(contentElement.innerHTML, {
			USE_PROFILES: { html: true },
			ALLOWED_TAGS: ['a'],
			ALLOWED_ATTR: ['href', 'target']
		});

		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = sanitizedContent;

		const linkRegex = /([A-Za-z]+:\/\/[^\s]+)/g;

		tempDiv.childNodes.forEach((node: Node) => {
			if (node.nodeType === Node.TEXT_NODE && node.textContent) {
				const fragment = document.createDocumentFragment();
				let lastIndex = 0;
				let match: RegExpExecArray | null;

				while ((match = linkRegex.exec(node.textContent)) !== null) {
					const link = match[0];
					const precedingText = node.textContent.slice(lastIndex, match.index);

					if (precedingText) {
						fragment.appendChild(document.createTextNode(precedingText));
					}

					const anchor = document.createElement('a');
					anchor.href = link;
					anchor.textContent = link;
					anchor.target = '_blank';
					anchor.rel = 'noopener noreferrer';

					anchor.addEventListener('click', (e: MouseEvent) => {
						const url = new URL(anchor.href);
						if (url.host !== window.location.host) {
							e.preventDefault();
							handleExternalLink(anchor.href);
						}
					});

					fragment.appendChild(anchor);
					lastIndex = linkRegex.lastIndex;
				}

				if (lastIndex < node.textContent.length) {
					fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex)));
				}

				node.parentNode?.replaceChild(fragment, node);
			}
		});

		contentElement.innerHTML = '';
		contentElement.appendChild(tempDiv);
	}

	function handleExternalLink(url: string) {
		externalLink = new URL(url);
		clickingExternalLink = true;
	}
</script>

<div class={`${$$props.class} flex items-start gap-2`}>
	{#if includeAvatar}
		<a href="/@{handle}" class="inline-block max-h-[40px] min-w-[40px]">
			<Avatar size={10} src={cdnUrl(userId, 'small')} alt="A profile picture." />
		</a>
	{/if}

	{#if clickingExternalLink}
		<AlertDialog.Root bind:open={clickingExternalLink}>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title class="mb-2 select-none text-2xl font-bold">
						Leaving Lyntr
					</AlertDialog.Title>
					<AlertDialog.Description class="flex select-none flex-col gap-2">
						<span>This link leads to an external website.</span>
						<span class="rounded-md border-[1px] border-solid border-primary p-2 break-all">
							{externalLink}
						</span>
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<Button
						variant="outline"
						on:click={() => {
							clickingExternalLink = false;
						}}
					>
						Return to Lyntr
					</Button>
					<Button
						on:click={() => {
							if (!externalLink) return console.error('externalLink is null');
							window.open(externalLink);
							externalLink = null;
						}}
					>
						Open
					</Button>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	{/if}

	<div class="flex w-full flex-col text-left">
		<div class="flex w-full items-center justify-between gap-1 {smaller ? 'max-w-[300px]' : ''}">
			<div class="flex flex-grow items-center gap-1 overflow-hidden">
				<HoverCard.Root>
					<HoverCard.Trigger
						rel="noreferrer noopener"
						class="truncate {smaller
							? 'max-w-[30%]'
							: 'max-w-[60%]'} rounded-sm text-xl font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
						href="/@{handle}"
					>
						{username}
					</HoverCard.Trigger>
					<HoverCard.Content class="flex w-80 flex-row items-center gap-2">
						<div class="flex justify-between space-x-4">
							<Avatar size={10} src={cdnUrl(userId, 'small')} alt="Profile picture." />

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
						<Tooltip.Trigger>
							<div class="flex h-full w-7 justify-center">
								<img
									class="h-7 w-7"
									src={$mode !== 'light' ? 'white_mode_verified.png' : 'verified.png'}
									alt="This user is verified."
								/>
							</div>
						</Tooltip.Trigger>
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
						class="overflow-hidden text-clip rounded-sm text-lg text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
						href="/@{handle}"
					>
						@{handle}
					</HoverCard.Trigger>
					<HoverCard.Content class="w-80">
						<div class="flex justify-between space-x-4">
							<Avatar size={10} src={cdnUrl(userId, 'small')} alt="Profile picture." />

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
					<Popover.Content class="flex w-auto flex-col rounded-lg p-2 shadow-lg">
						<button
							on:click={handleCopy}
							class="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-lynt-foreground"
						>
							<Copy class="h-5 w-5 text-muted-foreground" />
							<span>Copy</span>
						</button>
						{#if isAuthor}
							<button
								on:click={handleDelete}
								class="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-lynt-foreground"
							>
								<Trash class="h-5 w-5 text-muted-foreground" />
								<span>Delete</span>
							</button>
						{:else}
							<Report {userId} lyntId={postId} />
						{/if}
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>

		<span bind:this={contentElement} class="max-w-[490px] whitespace-pre-wrap break-words text-lg"
			>{truncated}</span
		>

		{#if needsReadMore}
			<span class="mt-2 text-sm text-muted-foreground hover:underline">Click to Read more...</span>
		{/if}
	</div>
</div>
{#if has_image}
	<img class="avatar mt-2 max-h-[600px] object-contain" src={cdnUrl(postId)} alt="ok" />
{/if}
