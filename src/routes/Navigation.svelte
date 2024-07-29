<script lang="ts">
	import { Button } from '@/components/ui/button/index';
	import { House, Search, Bell, User, Plus } from 'lucide-svelte';
	import OutlineButton from './OutlineButton.svelte';
	import { currentPage } from './stores';
	import { goto } from '$app/navigation';
	import { toggleMode } from 'mode-watcher';
	import PostButton from './PostButton.svelte';
        import { onMount } from 'svelte';
        import { unreadMessages } from "./stores";

	export let id: string;
	export let handle: string;
	export let navItems = [
		{ icon: House, label: 'Home', page: 'home' },
		{ icon: Search, label: 'Search', page: 'search' },
		{ icon: Bell, label: 'Notifications', page: 'notifications' },
		{ icon: User, label: 'Profile', page: 'profile' + handle }
	];

	function handleNavClick(page: string) {
		currentPage.set(page);
		if (page === 'home') {
			goto('/');
		}
		if (page === 'profile' + handle) {
			goto(`/@${handle}`);
		}
	}

        onMount(async () => {
            const response = await fetch('/api/notifications/unread');
            if (response.ok) {
                $unreadMessages = (await response.json()).count;
            } else {
                console.error('Failed to fetch unread messages');
            }
        });
</script>

<div
	class="inline-flex w-full flex-row items-start gap-2 rounded-[12px] bg-border p-[12px] md:min-w-[250px] md:flex-col"
>
	<button class="flex w-full items-center justify-center md:hidden" on:click={toggleMode}>
		<img
			class="size-8 cursor-pointer"
			src="logo.svg"
			alt="Logo"
		/>
	</button>
	{#each navItems as item}
		<OutlineButton
			icon={item.icon}
			text={item.label}
                        secondary={item.label === 'Notifications' && $unreadMessages > 0 ? $unreadMessages : undefined}
			className="border-none w-full md:w-auto"
			on:click={() => handleNavClick(item.page)}
		/>
	{/each}
</div>

<div class="aspect-square h-full p-0.5 md:hidden">
	<PostButton userId={id} class="h-full w-full md:hidden">
		<Plus />
	</PostButton>
</div>
