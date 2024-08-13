<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { Input } from '@/components/ui/input';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;
</script>

<span class="select-none">What is the next number in this sequence?</span>
<span class="select-none text-4xl">2, 6, 12, 20, 30</span>

<Input
	type="number"
	placeholder="Your guess..."
	bind:value={$submittedValue}
	on:change={() => ($isButtonDisabled = false)}
/>
