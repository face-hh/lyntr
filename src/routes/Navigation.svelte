<script>
	import { Button } from '@/components/ui/button/index';
	import { House, Search, Bell } from 'lucide-svelte';
	import OutlineButton from './OutlineButton.svelte';

	export let navItems = [
		{ icon: House, label: 'Home' },
		{ icon: Search, label: 'Search' },
		{ icon: Bell, label: 'Notifications' }
	];
</script>

<div
	class="inline-flex w-full min-w-[250px] flex-col items-start gap-2 rounded-[12px] bg-border p-[12px]"
>
	{#each navItems as item}
		<OutlineButton icon={item.icon} text={item.label} className="border-none" />
	{/each}
</div>
