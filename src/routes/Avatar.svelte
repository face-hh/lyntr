<script>
	import { createEventDispatcher } from 'svelte';

	export let size = 12;
	export let src = 'https://github.com/face-hh.png';
	export let alt = 'Avatar';
	export let border = false;
	export let editable = false;

	const dispatch = createEventDispatcher();

	function handleClick() {
		if (editable) {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/*';
			input.onchange = (e) => {
				const file = e.target.files[0];
				if (file) {
					dispatch('change', { file });

					const reader = new FileReader();
					reader.onload = (e) => {
						src = e.target.result;
					};
					reader.readAsDataURL(file);
				}
			};
			input.click();
		}
	}
</script>

<img
	{src}
	{alt}
	class="h-{size} w-{size} rounded-full {border
		? 'border-2 border-solid border-primary'
		: ''} {editable ? 'cursor-pointer' : ''} text-center"
	on:click={handleClick}
        on:error|once={(e) => e.target.src = "/default.webp"}
/>
