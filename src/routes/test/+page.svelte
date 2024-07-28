<script lang="ts">
    import "../../app.css";
    import { writable } from 'svelte/store';
    import TypingTest from '../Questions/TypingTest.svelte';

    const isButtonDisabled = writable(false);
    const submittedValue = writable('');
</script>

<TypingTest {...{
    isButtonDisabled,
    submittedValue
}}/>
