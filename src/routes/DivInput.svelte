<script lang="ts">
	export let lynt: string = '';

	$: characterCount = lynt.length;
	$: isOverLimit = characterCount > 280;

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
	}
</script>

<div class="relative">
	<div
		contenteditable="true"
		role="textbox"
		spellcheck="true"
		tabindex="0"
		bind:innerText={lynt}
		class="overflow-wrap-anywhere min-h-[40px] w-full pb-6 outline-none"
		placeholder="What's happening?"
		on:paste={handlePaste}
		on:keydown={interfere}
	/>
	<div class="absolute bottom-1 right-1 rounded px-1 text-sm" class:text-red-500={isOverLimit}>
		{characterCount}/280
	</div>
</div>