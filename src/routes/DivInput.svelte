<script lang="ts">
	import { createEventDispatcher } from "svelte";

	export let lynt: string = '';
	export let placeholder: string = "What's happening?";
	export let maxLength: number = 280;
	export let characterCountOnNewLine = false;

	let className: string = "";
	export { className as class };

	$: characterCount = lynt.length;
	$: isOverLimit = characterCount > maxLength;

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
		
		if (event.key === 'Enter') {
			event.preventDefault();
			document.execCommand('insertText', false, '\n');
		}

		if (event.key === 'Enter' && event.shiftKey) {
			dispatch('submit', {});
		}
	}

	function handleInput(event: Event) {
		dispatch('input', event);
	}

	function handleFocus(event: Event) {
		dispatch('focus', event);
	}
</script>

<div class="relative {className}">
	<div
		contenteditable="true"
		role="textbox"
		spellcheck="true"
		tabindex="0"
		bind:innerText={lynt}
		{placeholder}
		class="overflow-wrap-anywhere w-full pb-6 outline-none"
		on:paste={handlePaste}
		on:keydown={interfere}
		on:input={handleInput}
		on:focus={handleFocus}
	/>
	{#if lynt.split("\n").length > 1 || !characterCountOnNewLine}
		<div class="absolute bottom-1 right-1 rounded px-1 text-sm" class:text-red-500={isOverLimit}>
			{characterCount}/{maxLength}
		</div>
	{/if}
</div>
