<script lang="ts">
	import { onMount } from 'svelte';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import { cdnUrl } from './stores';

	import Avatar from './Avatar.svelte';

	export let userId: string;
	export let type: 'followers' | 'following';
	export let isOpen = false;
	export let onClose: () => void;

	let users: Array<{
		iq: any;
		id: string;
		username: string;
		handle: string;
	}> = [];
	let searchTerm = '';
	let loading = true;
	let currentPage = 1;
	let totalPages = 1;

	async function fetchUsers(page: number = 1, search: string = '') {
		loading = true;
		try {
			const endpoint = search
				? `/api/followsearch?q=${search}&type=${type}&userId=${userId}&page=${page}`
				: `/api/followlist?userId=${userId}&type=${type}&page=${page}`;

			const response = await fetch(endpoint);
			if (response.ok) {
				const data = await response.json();
				users = data.users;
				totalPages = data.totalPages;
				currentPage = data.currentPage;
			} else {
				console.error('Failed to fetch users');
			}
		} catch (error) {
			console.error('Error fetching users:', error);
		} finally {
			loading = false;
		}
	}

	function loadNextPage() {
		if (currentPage < totalPages) {
			fetchUsers(currentPage + 1, searchTerm);
		}
	}

	function loadPreviousPage() {
		if (currentPage > 1) {
			fetchUsers(currentPage - 1, searchTerm);
		}
	}

	onMount(() => {
		if (isOpen) {
			fetchUsers();
		}
	});

	$: if (isOpen) {
		fetchUsers(1, searchTerm);
	}
</script>

<Dialog bind:open={isOpen} on:close={onClose}>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle>{type === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
		</DialogHeader>
		<div class="grid gap-4 py-4">
			<div class="flex items-center gap-2">
				<Input
					type="text"
					placeholder="Search users"
					bind:value={searchTerm}
					on:input={() => fetchUsers(1, searchTerm)}
				/>
			</div>
			{#if loading}
				<p>Loading...</p>
			{:else if users.length === 0}
				<p>No users found.</p>
			{:else}
				<div class="mr-[-10px] flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-[10px]">
					{#each users as user (user.id)}
						<div class="flex items-center gap-2 rounded-md bg-border p-2">
							<Avatar size={12} src={cdnUrl(user.id, 'medium')} alt={user.username} />
							<div>
								<div class="inline-flex items-center gap-2">
									<p class="font-semibold">{user.username}</p>
									<span
										class="py-0.25 flex select-none items-center rounded-xl border border-transparent bg-primary px-1.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
										>{user.iq}</span
									>
								</div>
								<p class="text-sm text-muted-foreground">@{user.handle}</p>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 flex justify-between">
					<Button
						variant="outline"
						size="sm"
						on:click={loadPreviousPage}
						disabled={currentPage === 1}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						on:click={loadNextPage}
						disabled={currentPage === totalPages}
					>
						Next
					</Button>
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
