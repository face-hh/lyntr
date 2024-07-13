<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { Input } from '@/components/ui/input';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;
</script>

<span class="select-none">What is the full name of this element?</span>
<div class="flex justify-center">
	<img src="fr.png" alt="Cat :3" class="h-40 w-40" />
</div>

<Input
	on:input={() => ($isButtonDisabled = false)}
	bind:value={$submittedValue}
	placeholder="Your answer..."
	class="border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
></Input>
