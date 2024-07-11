<script lang="ts">
	import { Button } from '@/components/ui/button';
	import type { ComponentType } from 'svelte';
	import { writable } from 'svelte/store';

	import CatQuestion from './Questions/CatQuestion.svelte';
	import ShortFormContent from './Questions/ShortFormContent.svelte';
	import Chemistry from './Questions/Chemistry.svelte';
	import AGI from './Questions/AGI.svelte';
	import GPT from './Questions/GPT.svelte';
	import MathQuestion from './Questions/MathQuestion.svelte';
	import ContentCreators from './Questions/ContentCreators.svelte';
	import MathProblem from './Questions/MathProblem.svelte';
	import SequenceSymbol from './Questions/SequenceSymbol.svelte';
	import SequenceNumber from './Questions/SequenceNumber.svelte';
	import Dexerto from './Questions/Dexerto.svelte';
	import MathProblemComplex from './Questions/MathProblemComplex.svelte';
	import TypingTest from './Questions/TypingTest.svelte';
	import AudioRick from './Questions/AudioRick.svelte';
	import Degree from './Questions/Degree.svelte';
	import AudioAgeOfWar from './Questions/AudioAgeOfWar.svelte';
	import British from './Questions/British.svelte';
	import Kubernete from './Questions/Kubernete.svelte';
	import ReactionImage from './Questions/ReactionImage.svelte';
	import GimmickAccount from './Questions/GimmickAccount.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';

	const isButtonDisabled = writable(false);
	const submittedValue = writable('');

	const components = {
		AGI,
		CatQuestion,
		ShortFormContent,
		Chemistry,
		GPT,
		MathQuestion,
		ContentCreators,
		MathProblem,
		SequenceSymbol,
		SequenceNumber,
		Dexerto,
		MathProblemComplex,
		TypingTest,
		AudioRick,
		Degree,
		AudioAgeOfWar,
		British,
		Kubernete,
		ReactionImage,
		GimmickAccount
	};

	interface Question {
		id: keyof typeof components;
	}

	let questions: Question[] = [
		{ id: 'AGI' },
		{ id: 'CatQuestion' },
		{ id: 'ShortFormContent' },
		{ id: 'Chemistry' },
		{ id: 'GPT' },
		{ id: 'MathQuestion' },
		{ id: 'ContentCreators' },
		{ id: 'MathProblem' },
		{ id: 'SequenceSymbol' },
		{ id: 'SequenceNumber' },
		{ id: 'Dexerto' },
		{ id: 'MathProblemComplex' },
		{ id: 'TypingTest' },
		{ id: 'AudioRick' },
		{ id: 'Degree' },
		{ id: 'AudioAgeOfWar' },
		{ id: 'British' },
		{ id: 'Kubernete' },
		{ id: 'ReactionImage' },
		{ id: 'GimmickAccount' }
	];

	function shuffleArray<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	const saved_questions = localStorage.getItem('iq_questions');
	const saved_question = localStorage.getItem('current_question');
	const saved_iq = localStorage.getItem('iq');
	let currentQuestion = 0;
	let iq = 90;
    let loading = false;

	if (saved_questions) {
		questions = JSON.parse(saved_questions);
	} else {
		//questions = shuffleArray(questions);
	}

	if (saved_question) currentQuestion = parseInt(saved_question);
	if (saved_iq) iq = parseInt(saved_iq);

	localStorage.setItem('iq_questions', JSON.stringify(questions));
</script>

<div class="flex h-full flex-col gap-2">
	<span class="self-center text-4xl font-bold">IQ test</span>
	{#if loading}
		<LoadingSpinner occupy_screen={false} />
	{:else}
		{#if currentQuestion < questions.length}
			<svelte:component
				this={components[questions[currentQuestion].id]}
				{isButtonDisabled}
				{submittedValue}
			/>
		{:else}
			<div>All questions answered!</div>
		{/if}

		<Button
			on:click={async () => {
				loading = true;
                
                const response = await fetch(`/question?q=${questions[currentQuestion].id}&answer=${submittedValue}`);
				const res = await response.json()

                loading = false;
				currentQuestion++;
				localStorage.setItem('current_question', String(currentQuestion));
			}}
			disabled={$isButtonDisabled}>Next</Button
		>

		<div class="mt-auto flex justify-between">
			<span>{currentQuestion + 1}/{questions.length}</span>
			<span class="text-muted-foreground">Last round you got: -5 IQ</span>
			<span>80 IQ</span>
		</div>
	{/if}
</div>