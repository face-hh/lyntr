<script lang="ts">
    import { Button } from '@/components/ui/button/index';
    import { House, Search, Bell, User } from 'lucide-svelte';
    import OutlineButton from './OutlineButton.svelte';
    import { currentPage } from './stores';
	import { goto } from '$app/navigation';

    export let handle: string;
    export let navItems = [
        { icon: House, label: 'Home', page: 'home' },
        { icon: Search, label: 'Search', page: 'search' },
        { icon: Bell, label: 'Notifications', page: 'notifications' },
        { icon: User, label: 'Profile', page: 'profile' }
    ];

    function handleNavClick(page: string) {
        currentPage.set(page);
        if (page === 'home'){
            goto('/')
        }
        if (page === 'profile'){
            goto(`/@${handle}`)
        }
    }
</script>

<div class="inline-flex w-full min-w-[250px] flex-col items-start gap-2 rounded-[12px] bg-border p-[12px]">
    {#each navItems as item}
        <OutlineButton 
            icon={item.icon} 
            text={item.label} 
            className="border-none" 
            on:click={() => handleNavClick(item.page)}
        />
    {/each}
</div>