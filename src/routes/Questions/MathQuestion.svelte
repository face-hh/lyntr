<script lang="ts">
	import type { Writable } from 'svelte/store';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '@/components/ui/label';
	import { Input } from '@/components/ui/input';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;
</script>

<span class="select-none text-wrap">What's 15% of 200?</span>

<Input
	type="number"
	placeholder="Your guess..."
	bind:value={$submittedValue}
	on:change={() => ($isButtonDisabled = false)}
/>
