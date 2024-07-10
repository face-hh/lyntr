<script lang="ts">
    import CatQuestion from './Questions/CatQuestion.svelte';
    import ShortFormContent from './Questions/ShortFormContent.svelte';
    import Chemistry from './Questions/Chemistry.svelte';
    import AGI from './Questions/AGI.svelte';
    import GPT from './Questions/GPT.svelte';
    import MathEquation from './Questions/MathEquation.svelte';
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

    let questions = [
        { component: CatQuestion },
        { component: Thing },
        // Add more questions as needed
    ];

    let currentQuestion = 0;
</script>

{#if currentQuestion < questions.length}
    <svelte:component this={questions[currentQuestion].component} />
{:else}
    <div>All questions answered!</div>
{/if}

<button on:click={() => currentQuestion = Math.min(currentQuestion + 1, questions.length)}>
    Next Question
</button>