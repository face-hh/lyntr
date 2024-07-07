<script lang="ts">
	import type { ComponentType, SvelteComponent } from 'svelte';

	export let icon: ComponentType<SvelteComponent>;
	export let text: string | undefined = undefined;
	export let strokeWidth: number = 2.5;
	export let className: string = '';
	export let colorOnClick = false;

	let isActive = false;
</script>

<button
	class:active={isActive}
	on:click={() => {
		if (colorOnClick) {
			isActive = !isActive;
		}
	}}
	class="shit inline-flex items-center justify-center rounded-xl border-4 border-solid border-primary p-1 font-bold text-primary {className}"
>
	<svelte:component this={icon} {strokeWidth} class="h-6 w-6 {text ? 'mr-1' : ''}" />
	{#if text}
		<span>{text}</span>
	{/if}
</button>

<style>
	.shit {
		transition:
			filter 0.2s ease-in-out,
			border 0.2s ease-in-out,
			transform 0.2s ease-in-out,
			background-color 0.1s ease-in-out,
			color 0.1s ease-in-out;
	}

	.shit:hover {
		filter: drop-shadow(0 0px 20px rgba(38, 14, 0, 0.5));
		transform: rotate(3deg);
	}

	.shit.active {
		background-color: hsl(22 100% 15%);
		color: hsl(var(--background) / var(--tw-text-opacity));
        transform: rotate(0deg);
	}
</style>
