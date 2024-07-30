<script lang="ts">
	export let imageSrc = '/logo.svg'; // Replace with your image path
	export let size = 'w-48 h-48'; // Default size using Tailwind classes
	export let occupy_screen = true;
</script>

<div class="flex {occupy_screen ? 'h-dvh' : 'h-full'} animate-pulse">
	<div class="m-auto">
		<img src={imageSrc} alt="Loading" class={`${size} object-contain`} />
	</div>
</div>

<style>
	@keyframes custom-pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.animate-pulse {
		animation: custom-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
