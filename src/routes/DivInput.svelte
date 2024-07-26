<script lang="ts">
	export let lynt: string = '';
	
	$: characterCount = lynt.length;
	$: isOverLimit = characterCount > 280;

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const text = event.clipboardData?.getData('text/plain') || '';
		document.execCommand('insertText', false, text);
	}
</script>

<div class="relative">
	<div
		contenteditable="true"
		role="textbox"
		spellcheck="true"
		tabindex="0"
		bind:innerText={lynt}
		class="overflow-wrap-anywhere min-h-[40px] w-full outline-none pb-6"
		placeholder="What's happening?"
		on:paste={handlePaste}
	/>
	<div 
		class="absolute bottom-1 right-1 text-sm px-1 rounded"
		class:text-red-500={isOverLimit}
	>
		{characterCount}/280
	</div>
</div>