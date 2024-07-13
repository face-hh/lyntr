<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { Label } from '@/components/ui/label';
	import { Slider } from '@/components/ui/slider';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;

	let sliderValue = [0];

	// Reactive statement to watch for changes in sliderValue
	$: {
		$submittedValue = sliderValue[0].toString();
		$isButtonDisabled = false;
	}
</script>

<span class="select-none">How much time do you spend watching Short form content everyday?</span>

<Label>{sliderValue[0]} hours</Label>
<Slider bind:value={sliderValue} max={12} step={1} />
