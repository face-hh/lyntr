<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { createEventDispatcher } from 'svelte';
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

	const isButtonDisabled = writable(false);
	const submittedValue = writable('');

	const dispatch = createEventDispatcher();
	$: if (currentQuestion === questions.length) {
		dispatch('questionsCompleted', true);
	}

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
		{ id: 'AudioAgeOfWar' },
		{ id: 'AudioRick' },
		{ id: 'British' },
		{ id: 'CatQuestion' },
		{ id: 'Chemistry' },
		{ id: 'ContentCreators' },
		{ id: 'Degree' },
		{ id: 'Dexerto' },
		{ id: 'GimmickAccount' },
		{ id: 'GPT' },
		{ id: 'Kubernete' },
		{ id: 'MathProblem' },
		{ id: 'MathProblemComplex' },
		{ id: 'MathQuestion' },
		{ id: 'ReactionImage' },
		{ id: 'SequenceNumber' },
		{ id: 'SequenceSymbol' },
		{ id: 'ShortFormContent' },
		{ id: 'TypingTest' }
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
	let currentQuestion = 0;

	if (saved_questions) {
		questions = JSON.parse(saved_questions);
	} else {
		questions = shuffleArray(questions);
	}

	if (saved_question) currentQuestion = parseInt(saved_question);

	localStorage.setItem('iq_questions', JSON.stringify(questions));

	const props = {
		isButtonDisabled,
		submittedValue
	} as const;
</script>

<div class="flex h-full flex-col gap-2 px-1">
	<span class="self-center text-4xl font-bold">IQ test</span>
	{#if currentQuestion < questions.length}
		<svelte:component this={components[questions[currentQuestion].id]} {...props} />

		<Button
			on:click={async () => {
				localStorage.setItem(questions[currentQuestion].id, $submittedValue);
				if (currentQuestion !== 20) currentQuestion++;
				localStorage.setItem('current_question', String(currentQuestion));

				if (currentQuestion === questions.length) {
					dispatch('questionsCompleted', true);
				}

				$submittedValue = '';
			}}
			disabled={$isButtonDisabled}>Next</Button
		>
	{:else}
		<div>All questions answered! Please click the continue button.</div>
	{/if}

	<div class="mt-auto flex justify-between">
		<span>{Math.min(currentQuestion + 1, 20)}/{questions.length}</span>
		<span>Results are shown at the end.</span>
	</div>
</div>
