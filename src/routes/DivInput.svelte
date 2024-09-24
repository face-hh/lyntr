<script lang="ts">
	import { createEventDispatcher } from "svelte";

	export let lynt: string = '';
	export let placeholder: string = "What's happening?";
	export let maxLength: number = 280;
	export let charactersBeforeCount = 0;

	let className: string = "";
	let isOverLimit = false;

	$: characterCount = lynt.length;
	$: isOverLimit = characterCount > maxLength;

	export { isOverLimit, className as class };

	const dispatch = createEventDispatcher<{
	        input: Event;
		submit: {};
		focus: Event;
	}>();

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const text = event.clipboardData?.getData('text/plain') || '';
		document.execCommand('insertText', false, text);
	}
	
	function interfere(event: KeyboardEvent) {
		
		if (event.key === 'Enter' && event.shiftKey) {
			event.preventDefault();
			dispatch('submit', {});
		} else if (event.key === 'Enter') {
			event.preventDefault();
			document.execCommand('insertText', false, '\n');
		}
	}

	function handleInput(event: Event) {
		dispatch('input', event);
	}

	function handleFocus(event: Event) {
		dispatch('focus', event);
	}
</script>

<div class="relative {className} !p-0">
	<div class="relative {className}">
	<div
		contenteditable="true"
		role="textbox"
		spellcheck="true"
		tabindex="0"
		bind:innerText={lynt}
		{placeholder}
		class="overflow-wrap-anywhere outline-none"
		on:paste={handlePaste}
		on:keydown={interfere}
		on:input={handleInput}
		on:focus={handleFocus}
	/>
	</div>
	{#if lynt.length > charactersBeforeCount}
		<div class="absolute bottom-1 right-2 rounded px-1 text-sm bg-secondary/70 rounded-full" class:text-red-500={isOverLimit}>
			{characterCount}/{maxLength}
		</div>
	{/if}
</div>
