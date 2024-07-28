<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;

	let phrases = [
		'to be or not to be',
		'all that glitters is not gold',
		'actions speak louder than words',
		'where there is a will there is a way',
		'practice makes perfect',
		'knowledge is power',
		'time is money',
		'better late than never',
		'two wrongs dont make a right',
		'when in rome do as the romans do',
		'the early bird catches the worm',
		'an apple a day keeps the doctor away',
		'every cloud has a silver lining',
		'fortune favors the bold',
		'honesty is the best policy',
		'laughter is the best medicine',
		'necessity is the mother of invention',
		'a picture is worth a thousand words',
	];

	let unusedPhrases: string[] = [];
	let currentPhrase = '';
	let userInput = '';
	let timer = 60;
	let wordsTyped = 0;
	let testStarted = false;
	let testFinished = false;

	function getNextPhrase() {
		if (unusedPhrases.length === 0) {
			unusedPhrases = [...phrases];
		}
		const index = Math.floor(Math.random() * unusedPhrases.length);
		const phrase = unusedPhrases[index];
		unusedPhrases.splice(index, 1);
		return phrase;
	}

	function startTest() {
		testStarted = true;
		unusedPhrases = [...phrases];
		currentPhrase = getNextPhrase();
		timer = 60;
		wordsTyped = 0;
		userInput = '';

		const interval = setInterval(() => {
			timer--;
			if (timer <= 0) {
				clearInterval(interval);
				endTest();
			}
		}, 1000);
	}

	function endTest() {
		testFinished = true;
		const wpm = Math.round(wordsTyped / 1); // 1 minute test
		$submittedValue = wpm.toString();
		$isButtonDisabled = false;
	}

	function handleInput() {
		if (!testStarted) startTest();

		if (userInput.toLowerCase() === currentPhrase) {
			wordsTyped += currentPhrase.split(' ').length;
			currentPhrase = getNextPhrase();
			userInput = '';
		}
	}

	$: typedText = currentPhrase.split('').map((char, index) => ({
		char,
		isCorrect: userInput[index] === char,
		isTyped: index < userInput.length
	}));
</script>

<div class="flex flex-col items-center gap-4">
	<span class="select-none text-2xl">Simple WPM Test</span>

	{#if !testStarted}
		<Button on:click={startTest}>Start Test</Button>
	{:else if !testFinished}
		<span class="text-xl">Time remaining: {timer} seconds</span>
		<div class="whitespace-pre-wrap font-mono text-lg">
			{#each typedText as { char, isCorrect, isTyped }}
				{#if isTyped}
					<span class={isCorrect ? 'text-green-500' : 'text-red-500'}>{char}</span>
				{:else}
					<span class="text-gray-500">{char}</span>
				{/if}
			{/each}
		</div>
		<Input
			type="text"
			placeholder="Type here..."
			autocorrect="off"
			autocomplete="off"
			autocapitalize="none"
			bind:value={userInput}
			on:input={handleInput}
			disabled={testFinished}
		/>
	{:else}
		<span class="text-xl">Your WPM: {$submittedValue}</span>
	{/if}
</div>
