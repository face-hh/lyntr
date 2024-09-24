<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import Lynt from './Lynt.svelte';
	import { onMount } from 'svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { toast } from 'svelte-sonner';
	import Avatar from './Avatar.svelte';
	import { cdnUrl, currentPage } from './stores';
	import { goto } from '$app/navigation';

	let searchQuery = '';
	let searchResults: {
		results: any[];
		type: 'lynts' | 'users';
	} = { results: [], type: 'lynts' };
	let isLoading = false;
	let hasSearched = false;

	export let handleLyntClick;
	export let userId: string;
	export let myHandle: string;
	export let hideTitle = false;
	export let small = false;

	async function performSearch() {
		if (!searchQuery.trim()) return;
		isLoading = true;
		hasSearched = true;
		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
				method: 'GET'
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			searchResults = await response.json();
		} catch (error) {
			console.error('Search error:', error);
			toast('Failed to perform search. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			performSearch();
		}
	}

	function handleInput() {
		hasSearched = false;
		searchResults.results = [];
	}
</script>

<div
	class="mx-auto mt-5 flex h-full w-full flex-col items-center {small
		? 'max-w-[400px]'
		: ''} md:max-w-[600px]"
>
	<h1 class="mb-4 text-2xl font-bold {hideTitle ? 'hidden' : ''}">
		Search {searchResults.type?.charAt(0)?.toUpperCase() +
			searchResults.type?.slice(1)?.toLowerCase()}
	</h1>
	<div class="mb-4 flex w-full p-1">
		<Input
			type="text"
			placeholder="Search for {searchResults.type}..."
			bind:value={searchQuery}
			on:keypress={handleKeyPress}
			on:input={handleInput}
			class="mr-2 flex-grow"
		/>
		<Button on:click={performSearch}>Search</Button>
		<Button on:click={() => {
			searchQuery = "from:@" + myHandle;
			performSearch();
		}} class="ml-2">You</Button>
	</div>
	<div class="w-full flex-grow overflow-hidden">
		<div class="h-full overflow-y-auto overflow-x-hidden">
			{#if isLoading}
				<LoadingSpinner />
			{:else if hasSearched}
				{#if searchResults.results.length > 0}
					<div class="flex flex-col gap-4 px-1">
						{#each searchResults.results as result}
							{#if searchResults.type === 'lynts'}
								<Lynt {...result} myId={userId} lyntClick={handleLyntClick} {small} />
							{:else}
								<div
									class="flex flex-row gap-2 rounded-xl bg-secondary/70 p-3"
									on:click={() => {
										currentPage.set(`profile${result.handle}`);
										goto(`/@${result.handle}`);
									}}
								>
									<Avatar src={cdnUrl(result.id, 'medium')} alt={result.username} border={true} />
									<div class="flex flex-col gap-2">
										<div class="flex flex-row gap-2">
											<span class="max-w-64 overflow-hidden truncate">{result.username}</span>
											<Badge>{result.iq}</Badge>
											<span class="max-w-64 overflow-hidden truncate text-muted-foreground"
												>@{result.handle}</span
											>
										</div>
										<span class="break-word w-full overflow-hidden">{result.bio}</span>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<p>No results found for "{searchQuery}"</p>
				{/if}
			{/if}
		</div>
	</div>
</div>

<svelte:head>
	{#if hasSearched}
		<title>Searching for "{searchQuery}" | Lyntr</title>
	{:else}
		<title>Search | Lyntr</title>
	{/if}
</svelte:head>
