<script>
	import Avatar from './Avatar.svelte';

	export let src = 'https://github.com/face-hh.png';
	export let name = 'Face oifneoangoaen kfpeakfpae';
	export let handle = '@facedevstuff';
</script>

<div
	class="absolute bottom-2 flex w-[250px] max-w-md cursor-pointer items-center gap-4 rounded-full bg-border p-4"
>
	<Avatar size={12} {src} alt="Your profile picture." />
	<div class="flex flex-col gap-3 overflow-hidden">
		<span class="text-lg font-medium leading-none peer-enabled:cursor-pointer">
			{name}
		</span>
		<span class="text-sm font-medium leading-none text-muted-foreground">
			{handle}
		</span>
	</div>
</div>
